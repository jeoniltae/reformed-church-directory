// 교회 데이터 등록·수정·삭제 CLI — 오프라인 배치, 앱 런타임과 분리
//
// **data/churches.json을 직접 쓰지 않는다.** 그 파일은 import:source의 산출물이라
// 직접 고치면 다음 실행에서 되돌아간다. 여기서 고치는 것은 사람이 손대는 오버레이다.
//
//   등록 → data/additions.json
//   수정 → data/address-fixes.json   (키가 조회용 id다. find로 확인할 것)
//   삭제 → data/excluded.json
//   안내 → data/notices.json
//
// 판정 로직은 전부 scripts/lib/church-edit.mts에 있고 여기는 입출력만 맡는다.

import { readFileSync, writeFileSync } from "node:fs";
import {
  isSuspectPhone,
  normalizePhone,
  normalizeUrl,
  toChurchId,
} from "../src/lib/church-utils.ts";
import type { Church } from "../src/types/church.ts";
import {
  type AdditionsDoc,
  type AddressFixesDoc,
  appendAddition,
  appendExclusion,
  type ExcludedDoc,
  type FixEntry,
  type FixPatch,
  idChangeChecklist,
  type NoticeEntry,
  type NoticesDoc,
  resolveTarget,
  serialize,
  upsertFix,
  upsertNotice,
} from "./lib/church-edit.mts";
import { todayInSeoul } from "./lib/date.mts";
import {
  buildDenominationIndex,
  type DenominationTable,
} from "./lib/denominations.mts";
import { formatHits, scanSensitive } from "./lib/sensitive.mts";
import {
  type AdditionRow,
  buildRows,
  readSourceInputs,
  type SourceRow,
} from "./lib/source.mts";

const CHURCHES = "data/churches.json";
const ADDITIONS = "data/additions.json";
const ADDRESS_FIXES = "data/address-fixes.json";
const EXCLUDED = "data/excluded.json";
const NOTICES = "data/notices.json";
const DENOMINATIONS = "data/denominations.json";

// ── 인자 ─────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const command = argv[0] ?? "";
const target = argv.slice(1).find((a) => !a.startsWith("--")) ?? "";
const flag = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const DRY = argv.includes("--dry-run");
const today = todayInSeoul();

const USAGE = `교회 데이터 등록·수정·삭제

  npm run church -- find   <검색어>
  npm run church -- add    --name= --region= --subRegion= --address= [--pastor= --denomination= --phone= --homepage= --source-note=]
  npm run church -- edit   <검색어> [--address= --phone= --pastor= --homepage= --name= --subRegion= --region= --note=]
  npm run church -- remove <검색어> --reason=
  npm run church -- notice <검색어> --message= [--contact-label= --contact-phone= --reason=]

  --dry-run  파일을 쓰지 않고 결과만 본다

검색어는 교회명·출력 id·조회용 id 아무거나 된다. 후보가 여럿이면 목록만 보여주고 멈춘다.`;

// ── 공용 ─────────────────────────────────────────────────────────────────

// .mts에서 제네릭 화살표 함수는 후행 쉼표가 있어야 JSX로 오인되지 않는다
const readDoc = <T,>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;

function die(message: string): never {
  console.error(message);
  process.exit(1);
}

/**
 * 쓰기 직전에 민감정보를 훑는다. git 이력은 되돌릴 수 없으므로 입구에서 막는다 —
 * PreToolUse 훅과 같은 함수를 쓰므로 손으로 고치든 이 CLI로 고치든 같은 선이 걸린다.
 */
function writeDoc(path: string, doc: unknown): void {
  const hits = scanSensitive(doc);
  if (hits.length) {
    console.error(`\n${formatHits(hits)}`);
    die(`\n${path}를 쓰지 않고 중단했다. 값을 확인하고 다시 실행할 것.`);
  }
  if (DRY) {
    console.log(`\n※ --dry-run이라 ${path}를 쓰지 않았다.`);
    return;
  }
  writeFileSync(path, serialize(doc), "utf8");
  console.log(`\n${path} 갱신됨`);
}

/** 대상 하나를 고른다. 못 고르면 이유를 보여주고 멈춘다 — 엉뚱한 교회를 고치지 않는다 */
function resolveOrDie(rows: readonly SourceRow[], query: string): SourceRow {
  if (!query) die(`검색어가 없다.\n\n${USAGE}`);
  const result = resolveTarget(rows, query);
  if (result.status === "ok") return result.row;
  if (result.status === "notFound") {
    die(`'${query}'에 해당하는 교회가 없다. npm run church -- find <검색어>로 확인할 것.`);
  }
  console.error(
    `'${query}'에 해당하는 교회가 ${result.matches.length}건이다. 더 좁혀서 다시 부를 것.`,
  );
  for (const r of result.matches) console.error(`  · ${r.name} — ${r.id}`);
  process.exit(1);
}

/**
 * 주소가 바뀌었거나 새로 들어온 교회는 좌표가 없다.
 * **주소를 재조회하면 좌표도 무효가 되므로** 두 단계를 붙여서 안내한다.
 */
function printNextSteps(churchName: string, addressChanged: boolean): void {
  console.log("\n다음 순서로 반영한다.");
  if (addressChanged) {
    console.log(`  1. npm run normalize:addresses -- --only=${churchName}`);
    console.log("  2. npm run geocode:coords");
    console.log("  3. npm run import:source");
    console.log("  ※ 2를 건너뛰면 좌표 없이 상세 페이지가 구워진다.");
  } else {
    console.log("  1. npm run import:source");
  }
}

type BuildInput = Omit<ReturnType<typeof readSourceInputs>, "droppedColumns">;

/**
 * 교정·등록을 실제 변환에 한 번 태워 본다.
 * 예상 id를 손으로 계산하지 않는다 — 충돌 규칙이 buildRows 한 곳에만 있어야 한다.
 */
function simulate(base: BuildInput, override: Partial<BuildInput>): SourceRow[] {
  try {
    return buildRows({ ...base, ...override }).rows;
  } catch (e) {
    return die(`\n${(e as Error).message}`);
  }
}

// ── find ─────────────────────────────────────────────────────────────────

function describe(row: SourceRow, published: Map<string, Church>): void {
  const church = published.get(row.id);
  console.log(`\n${row.name}`);
  console.log(`  출력 id    ${row.id}`);
  console.log(`  조회용 id  ${row.lookupId}`);
  if (row.id !== row.lookupId) {
    console.log("  ⚠ 둘이 다르다 — 상세 URL·geocode·notices·excluded는 출력 id를,");
    console.log(`    ${ADDRESS_FIXES}는 조회용 id를 키로 쓴다.`);
  }
  console.log(`  지역       ${row.region}${row.subRegion ? ` ${row.subRegion}` : ""}`);
  console.log(`  주소       ${row.rawAddress}`);
  console.log(`  담임목사   ${row.pastor || "(없음)"}`);
  console.log(`  교단       ${row.denomination || "(없음)"}`);
  console.log(`  전화       ${row.phone || "(없음)"}`);
  console.log(`  홈페이지   ${row.homepageCorrected || row.homepage || "(없음)"}`);
  if (church) {
    console.log(
      `  수록       ${CHURCHES}에 있음 (${church.lat === undefined ? "좌표 없음" : "좌표 있음"})`,
    );
  } else {
    console.log(`  수록       ${CHURCHES}에 없음 — 삭제 요청 목록에 있거나 아직 반영 전이다`);
  }
}

function cmdFind(rows: readonly SourceRow[], query: string): void {
  if (!query) die(`검색어가 없다.\n\n${USAGE}`);
  const published = new Map(readDoc<Church[]>(CHURCHES).map((c) => [c.id, c]));
  const result = resolveTarget(rows, query);
  if (result.status === "notFound") die(`'${query}'에 해당하는 교회가 없다.`);
  const matches = result.status === "ok" ? [result.row] : result.matches;
  console.log(`'${query}' → ${matches.length}건`);
  for (const r of matches) describe(r, published);
}

// ── add ──────────────────────────────────────────────────────────────────

function cmdAdd(base: BuildInput): void {
  const row: AdditionRow & { addedAt: string; sourceNote?: string } = {
    region: flag("region") ?? "",
    subRegion: flag("subRegion") ?? "",
    name: flag("name") ?? "",
    pastor: flag("pastor") ?? "",
    denomination: flag("denomination") ?? "",
    phone: flag("phone") ?? "",
    address: flag("address") ?? "",
    homepage: flag("homepage") ?? "",
    addedAt: today,
  };
  const sourceNote = flag("source-note");
  if (sourceNote) row.sourceNote = sourceNote;

  const missing = (["name", "region", "subRegion", "address"] as const).filter(
    (k) => !row[k].trim(),
  );
  if (missing.length) die(`빠진 값: ${missing.join(", ")}\n\n${USAGE}`);

  // 예상 id는 시뮬레이션으로 얻는다. 충돌이면 buildRows가 던지고 여기서 멈춘다.
  const before = simulate(base, {});
  const after = simulate(base, { additions: [...base.additions, row] });
  const created = after[after.length - 1];
  if (before.some((r) => r.id === created.id)) {
    die(`id '${created.id}'가 이미 있다. 교회명이나 시군구를 확인할 것.`);
  }

  // **번호가 붙었다는 것은 같은 이름·시군구가 이미 있다는 뜻이다.**
  // 진짜 다른 교회일 수도 있지만 대개는 같은 교회를 두 번 넣는 실수다.
  // 막지는 않되(동명 교회는 실제로 있다) 반드시 사람이 한 번 보고 지나가게 한다.
  if (created.id !== toChurchId(row.name, row.subRegion)) {
    const twins = before.filter((r) => r.name === row.name && r.subRegion === row.subRegion);
    console.error(`'${row.name}'(${row.subRegion})가 이미 ${twins.length}건 있다.`);
    for (const t of twins) console.error(`  · ${t.id} — ${t.pastor || "담임목사 미상"} · ${t.rawAddress}`);
    if (!argv.includes("--allow-duplicate")) {
      die(
        `\n이대로 넣으면 새 id는 '${created.id}'가 된다.\n` +
          "같은 교회를 다시 넣는 것이라면 add가 아니라 edit을 쓸 것.\n" +
          "이름만 같은 다른 교회가 맞으면 --allow-duplicate를 준다.",
      );
    }
    console.log(`  ⚠ 동명 교회로 확인받아 id에 번호가 붙는다: ${created.id}`);
  }

  console.log(`${row.name} 등록`);
  console.log(`  출력 id    ${created.id}`);
  console.log(
    `  지역       ${created.region}${created.subRegion ? ` ${created.subRegion}` : ""}`,
  );
  console.log(`  주소       ${created.rawAddress}`);

  if (!row.pastor.trim()) console.log("  ※ 담임목사가 비었다.");
  if (!row.phone.trim()) console.log("  ※ 전화번호가 비었다.");
  else if (isSuspectPhone(row.phone)) {
    console.log(`  ⚠ 전화번호 형식 확인 필요: ${row.phone} → ${normalizePhone(row.phone)}`);
  }
  if (row.homepage?.trim()) console.log(`  홈페이지   ${normalizeUrl(row.homepage)}`);

  if (!row.denomination.trim()) {
    console.log("  ※ 교단이 비었다 — 배지와 교단 필터에 잡히지 않는다.");
  } else {
    const index = buildDenominationIndex(readDoc<DenominationTable>(DENOMINATIONS));
    if (!index.has(row.denomination)) {
      console.log(`  ⚠ 교단 표기 '${row.denomination}'가 ${DENOMINATIONS}에 없다.`);
      console.log("    원본 그대로 실리고 묶음은 비게 된다 — 판정표에 행을 추가할 것.");
    }
  }

  writeDoc(ADDITIONS, appendAddition(readDoc<AdditionsDoc>(ADDITIONS), row));
  printNextSteps(row.name, true);
}

// ── edit ─────────────────────────────────────────────────────────────────

/** CLI 플래그 → address-fixes.json의 키. 이름이 다른 이유는 파일 쪽이 '교정'을 뜻해서다 */
const EDIT_FLAGS = [
  ["address", "corrected"],
  ["phone", "phoneCorrected"],
  ["pastor", "pastorCorrected"],
  ["homepage", "homepageCorrected"],
  ["name", "nameCorrected"],
  ["subRegion", "subRegionCorrected"],
  ["region", "regionCorrected"],
  ["note", "note"],
] as const;

function cmdEdit(base: BuildInput, rows: SourceRow[]): void {
  const row = resolveOrDie(rows, target);

  const patch: FixPatch = {};
  for (const [cli, key] of EDIT_FLAGS) {
    const v = flag(cli);
    if (v !== undefined) (patch as Record<string, string>)[key] = v;
  }
  if (!Object.keys(patch).length) die(`고칠 값이 없다.\n\n${USAGE}`);

  const doc = readDoc<AddressFixesDoc>(ADDRESS_FIXES);
  if (!doc.fixes.some((f) => f.id === row.lookupId)) {
    // 새 행에는 원본 값을 참고로 남긴다 — 나중에 무엇을 왜 고쳤는지 대조할 수 있게
    patch.church = row.name;
    if (patch.corrected !== undefined) patch.original = row.rawAddress;
    if (patch.phoneCorrected !== undefined) patch.phoneHint = row.phone;
    if (patch.pastorCorrected !== undefined) patch.pastorHint = row.pastor;
    if (patch.homepageCorrected !== undefined) patch.homepageHint = row.homepage;
  }

  const next = upsertFix(doc, row.lookupId, patch);
  const fixes = new Map<string, FixEntry>(next.fixes.map((f) => [f.id, f]));
  const after = simulate(base, { fixes });
  const updated = after[rows.indexOf(row)];

  console.log(`${row.name} 수정`);
  console.log(`  조회용 id  ${row.lookupId}  ← ${ADDRESS_FIXES}의 키`);
  for (const [cli, key] of EDIT_FLAGS) {
    const v = (patch as Record<string, string | undefined>)[key];
    if (v === undefined) continue;
    console.log(`  ${cli}: ${v === "" ? "(교정 해제)" : v}`);
  }
  if (patch.phoneCorrected && isSuspectPhone(patch.phoneCorrected)) {
    console.log(`  ⚠ 전화번호 형식 확인 필요: ${patch.phoneCorrected}`);
  }

  if (updated.id !== row.id) {
    console.log(`\n⚠ id가 바뀐다: ${row.id} → ${updated.id}`);
    for (const line of idChangeChecklist(row.id, updated.id)) console.log(`  ${line}`);
  }

  writeDoc(ADDRESS_FIXES, next);
  printNextSteps(
    updated.name,
    patch.corrected !== undefined ||
      patch.subRegionCorrected !== undefined ||
      patch.regionCorrected !== undefined,
  );
}

// ── remove ───────────────────────────────────────────────────────────────

function cmdRemove(rows: SourceRow[]): void {
  const row = resolveOrDie(rows, target);
  const reason = flag("reason");
  if (!reason?.trim()) {
    die(`--reason=이 필요하다. 왜 지웠는지 남지 않으면 다음에 판단할 수 없다.\n\n${USAGE}`);
  }

  console.log(`${row.name} 삭제 요청 등록`);
  console.log(`  출력 id    ${row.id}  ← ${EXCLUDED}의 키`);
  console.log(`  사유       ${reason}`);
  console.log(`  접수일     ${today}`);
  console.log("\n※ 원본은 그대로 두고 변환에서 제외한다 — 이 목록이 없으면 다음 변환에서 되살아난다.");
  console.log("※ 이미 배포된 상세 페이지는 다음 배포에서 사라진다. git 이력에는 남는다.");

  writeDoc(EXCLUDED, appendExclusion(readDoc<ExcludedDoc>(EXCLUDED), row.id, reason, today));
  printNextSteps(row.name, false);
}

// ── notice ───────────────────────────────────────────────────────────────

function cmdNotice(rows: SourceRow[]): void {
  const row = resolveOrDie(rows, target);
  const message = flag("message");
  if (!message?.trim()) die(`--message=가 필요하다.\n\n${USAGE}`);

  const label = flag("contact-label");
  const phone = flag("contact-phone");
  if (Boolean(label) !== Boolean(phone)) {
    die("--contact-label=과 --contact-phone=은 함께 준다.");
  }
  const reason = flag("reason");

  const entry: NoticeEntry = {
    id: row.id,
    message,
    ...(label && phone ? { contact: { label, phone: normalizePhone(phone) } } : {}),
    ...(reason ? { reason } : {}),
  };

  console.log(`${row.name} 안내 등록`);
  console.log(`  출력 id    ${row.id}  ← ${NOTICES}의 키`);
  console.log(`  문구       ${message}`);
  if (entry.contact) {
    console.log(`  창구       ${entry.contact.label} ${entry.contact.phone}`);
    console.log("  ⚠ 제3자 번호를 넣는 것은 그 조직에 문의 전화를 보내는 일이다.");
    console.log("    노회·총회 사무국은 이 사이트의 데이터 공백을 대신 받아주기로 한 적이 없다.");
    console.log("    교회 자체 연락처로 충분하면 비워 둘 것.");
  }
  console.log("\n※ 경고가 아니라 안내다. 확인하지 못한 것은 우리 데이터의 한계이지 그 교회의 결함이 아니다.");

  writeDoc(NOTICES, upsertNotice(readDoc<NoticesDoc>(NOTICES), entry));
  printNextSteps(row.name, false);
}

// ── 실행 ─────────────────────────────────────────────────────────────────

if (!command || command === "help" || command === "--help") {
  console.log(USAGE);
  process.exit(0);
}

const inputs = readSourceInputs();
const base: BuildInput = {
  header: inputs.header,
  body: inputs.body,
  additions: inputs.additions,
  fixes: inputs.fixes,
};
const rows = buildRows(base).rows;

switch (command) {
  case "find":
    cmdFind(rows, target);
    break;
  case "add":
    cmdAdd(base);
    break;
  case "edit":
    cmdEdit(base, rows);
    break;
  case "remove":
    cmdRemove(rows);
    break;
  case "notice":
    cmdNotice(rows);
    break;
  default:
    die(`알 수 없는 명령: ${command}\n\n${USAGE}`);
}
