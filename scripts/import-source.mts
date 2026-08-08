// 보유 개혁교회 CSV를 data/churches.json으로 변환한다 — 오프라인 배치, 앱 런타임과 분리

import { readFileSync, writeFileSync } from "node:fs";
import {
  isSuspectPhone,
  normalizeAddress,
  normalizePhone,
  normalizeRegion,
  normalizeUrl,
  toChurchId,
} from "../src/lib/church-utils.ts";
import type { Church } from "../src/types/church.ts";

const INPUT = "data/raw/추천교회.CSV";
const OUTPUT = "data/churches.json";
const DEAD_LINKS = "data/dead-links.json";
const ADDRESS_FIXES = "data/address-fixes.json";
const HEADER_ROW = 3; // 1-based. 1행 제목, 2행 빈 줄
const SOURCE = "자체 수집";

/** 수록할 열만 화이트리스트로 뽑는다. 비고는 자유서술이라 제외한다 */
const COLUMNS = [
  "지역",
  "sub-지역",
  "교회명",
  "담임목사",
  "교단",
  "전화번호",
  "주소",
] as const;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const raw = new TextDecoder("euc-kr").decode(readFileSync(INPUT));
const table = parseCsv(raw);
const header = table[HEADER_ROW - 1].map((h) => h.trim());
const rows = table
  .slice(HEADER_ROW)
  .filter((r) => r.some((c) => c && c.trim() !== ""));

const at = (row: string[], column: string): string => {
  const i = header.indexOf(column);
  return i === -1 ? "" : (row[i] ?? "").trim();
};

// 생존 확인에서 죽은 것으로 판정된 URL. 원본 CSV를 고치지 않으므로
// 이 목록이 없으면 다음 변환에서 되살아난다.
const deadLinks = new Set<string>(
  (
    JSON.parse(readFileSync(DEAD_LINKS, "utf8")) as {
      links: { url: string }[];
    }
  ).links.map((l) => l.url),
);

// 사람이 확인해 교정한 값. 원본 CSV를 고치지 않으므로 이 목록이 없으면 되돌아간다.
type Fix = {
  id: string;
  corrected?: string;
  phoneCorrected?: string;
  pastorCorrected?: string;
};
const fixes = new Map<string, Fix>(
  (JSON.parse(readFileSync(ADDRESS_FIXES, "utf8")) as { fixes: Fix[] }).fixes.map(
    (f) => [f.id, f],
  ),
);
const fixOf = (id: string, key: keyof Omit<Fix, "id">): string | undefined => {
  const v = fixes.get(id)?.[key]?.trim();
  return v ? v : undefined;
};

const warnings: string[] = [];
const idCount = new Map<string, number>();
const churches: Church[] = [];
let droppedLinks = 0;
const fixedCount = { address: 0, phone: 0, pastor: 0 };

for (const row of rows) {
  const name = at(row, "교회명");
  const subRegion = at(row, "sub-지역");
  const phone = at(row, "전화번호");
  const homepage = at(row, "홈페이지");
  const denomination = at(row, "교단");

  let id = toChurchId(name, subRegion);
  const seen = idCount.get(id) ?? 0;
  idCount.set(id, seen + 1);
  if (seen > 0) {
    id = `${id}-${seen + 1}`;
    warnings.push(`ID 충돌 → ${id} (${name})`);
  }

  const fixedAddress = fixOf(id, "corrected");
  const fixedPhone = fixOf(id, "phoneCorrected");
  const fixedPastor = fixOf(id, "pastorCorrected");
  if (fixedAddress) fixedCount.address++;
  if (fixedPhone) fixedCount.phone++;
  if (fixedPastor) fixedCount.pastor++;

  const church: Church = {
    id,
    name,
    region: normalizeRegion(at(row, "지역")),
    address: fixedAddress ?? normalizeAddress(at(row, "주소")),
    pastor: fixedPastor ?? at(row, "담임목사"),
    source: SOURCE,
  };
  if (subRegion) church.subRegion = subRegion;
  if (denomination) church.denomination = denomination;
  // 교정값이 있으면 그것을 쓴다. 여전히 형식이 어긋나면 사람에게 다시 알린다.
  const effectivePhone = fixedPhone ?? phone;
  if (effectivePhone) {
    church.phone = normalizePhone(effectivePhone);
    if (isSuspectPhone(effectivePhone)) {
      warnings.push(`전화번호 형식 확인 필요 → ${name}: ${effectivePhone}`);
    }
  }
  if (homepage) {
    const url = normalizeUrl(homepage);
    if (deadLinks.has(url)) droppedLinks++;
    else church.homepage = url;
  }

  churches.push(church);
}

// 화이트리스트에 없는 열이 원본에 있으면 알린다 (비고 등은 의도적으로 버린다)
const dropped = header.filter(
  (h) => h && !COLUMNS.includes(h as (typeof COLUMNS)[number]) && h !== "홈페이지",
);

writeFileSync(OUTPUT, JSON.stringify(churches, null, 2) + "\n", "utf8");

console.log(`${churches.length}건 → ${OUTPUT}`);
console.log(`버린 열: ${dropped.length ? dropped.join(", ") : "없음"}`);
console.log(
  `죽은 링크로 비운 homepage: ${droppedLinks}건 (등록 ${deadLinks.size}건, ${DEAD_LINKS})`,
);
console.log(
  `사람이 교정한 값: 주소 ${fixedCount.address} · 전화 ${fixedCount.phone} · 담임목사 ${fixedCount.pastor}  (${ADDRESS_FIXES})`,
);
if (droppedLinks !== deadLinks.size) {
  warnings.push(
    `dead-links.json의 URL ${deadLinks.size - droppedLinks}건이 원본과 매칭되지 않았다 — 오타 또는 원본 변경`,
  );
}
if (warnings.length) {
  console.log(`\n확인 필요 ${warnings.length}건`);
  for (const w of warnings) console.log(`  · ${w}`);
}
