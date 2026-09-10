// 도로명주소 검색 API로 보유 주소를 진단한다 — 보고만 하고 churches.json은 건드리지 않는다

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { normalizeRegion, toAddressKeyword } from "../src/lib/church-utils.ts";
import { pickByChurchName, pickExactMatch } from "./lib/address-match.mts";
import { readSource, type SourceRow } from "./lib/source.mts";

// 커밋 대상이다. import-source가 이 파일을 읽어 정규화된 주소를 반영하고,
// 2단계(좌표)도 여기 coordParams를 쓴다. 저장소를 clone하면 재실행 없이 같은 결과가 나온다.
const OUTPUT = "data/geocode.json";
const ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";
const DELAY_MS = 1000; // 준수 사항의 "초당 1건 이하"를 그대로 따른다
const TIMEOUT_MS = 15_000;

const KEY = process.env.JUSO_SEARCH_KEY;
if (!KEY) {
  console.error("JUSO_SEARCH_KEY가 없다. .env.local에 넣고 --env-file로 실행할 것.");
  console.error("  npm run normalize:addresses");
  process.exit(1);
}

/** 도로명주소 검색 API가 돌려주는 항목 중 우리가 쓰는 것만 */
type Juso = {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  siNm: string;
  sggNm: string;
  hstryYn: string;
  admCd: string;
  rnMgtSn: string;
  udrtYn: string;
  buldMnnm: string;
  buldSlno: string;
};

type Status = "ok" | "multiple" | "notFound" | "historical" | "regionMismatch" | "apiError";

type Entry = {
  id: string;
  name: string;
  status: Status;
  reason: string;
  /** 원본 그대로 실패해 검색어를 다듬어 다시 찾은 경우 그 검색어 */
  keywordUsed?: string;
  original: { address: string; region: string; subRegion?: string };
  matched?: {
    roadAddr: string;
    jibunAddr: string;
    zipNo: string;
    siNm: string;
    sggNm: string;
    /** 좌표제공 API에 그대로 넘길 값. 2단계가 이 파일을 읽어 쓴다 */
    coordParams: Record<string, string>;
    /**
     * 2단계(`geocode:coords`)가 채우는 값. **여기서 만들지는 않지만 타입에는 있어야 한다.**
     * 예전에는 이 필드가 타입에 없어서 파일을 다시 쓸 때 이전 좌표가 통째로 사라졌고,
     * 주소를 한 건만 고쳐도 전체 좌표를 다시 받아야 했다. 아래 `carryCoord` 참고.
     */
    coord?: { lat: number; lng: number; entX: number; entY: number };
  };
  totalCount?: number;
};

/** 좌표를 결정하는 다섯 코드. 이것이 그대로면 좌표도 반드시 그대로다 */
const COORD_KEYS = ["admCd", "rnMgtSn", "udrtYn", "buldMnnm", "buldSlno"] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(keyword: string): Promise<{ total: number; juso: Juso[] } | { error: string }> {
  const url = `${ENDPOINT}?${new URLSearchParams({
    confmKey: KEY!,
    currentPage: "1",
    // 후보를 전부 받아야 그중 원본과 일치하는 것을 찾을 수 있다. 10이면 38건짜리
    // 조회에서 정답이 11번째일 때 아예 손에 들어오지 않는다 (100까지 받는 것을 실호출로 확인).
    countPerPage: "100",
    keyword,
    resultType: "json", // 기본값이 xml이라 반드시 지정한다
  })}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
  if (!res.ok) return { error: `HTTP ${res.status}` };

  const body = (await res.json()) as {
    results?: { common?: { errorCode?: string; errorMessage?: string; totalCount?: string }; juso?: Juso[] | null };
  };
  const common = body.results?.common;
  if (!common) return { error: "예상과 다른 응답 형식" };
  if (common.errorCode !== "0") {
    return { error: `${common.errorCode}: ${common.errorMessage ?? ""}`.trim() };
  }
  return { total: Number(common.totalCount ?? 0), juso: body.results?.juso ?? [] };
}

function classify(church: SourceRow, r: { total: number; juso: Juso[] }): Entry {
  const base = {
    id: church.id,
    name: church.name,
    original: { address: church.rawAddress, region: church.region, subRegion: church.subRegion },
    totalCount: r.total,
  };

  if (r.total === 0 || r.juso.length === 0) {
    return { ...base, status: "notFound", reason: "검색 결과 없음" };
  }

  // 후보가 여럿이면 두 가지로 좁힌다. 둘 다 **유일할 때만** 잡히므로 사람 판단을
  // 대신하지 않는다 — 한 지번에 건물이 둘이면 둘 다 걸려 multiple로 남는다.
  //
  // 건물명을 먼저 보는 이유: 주소가 같은 건물이 여럿일 때 어느 것이 이 교회인지는
  // 주소로는 알 수 없고 건물명만 알려준다(신반포중앙교회는 `잠원동 60-3`이 건물명
  // 없이 두 번 나와 주소로는 못 가른다). 주소 일치는 그다음이며, 후보 대부분이
  // 부번 변형(`115-9`·`8-2`)이라 본번이 맞는 것은 보통 하나뿐이다.
  let picked: Juso | null = null;
  let pickedBy = "";
  if (r.juso.length > 1) {
    picked = pickByChurchName(church.name, r.juso);
    if (picked) pickedBy = "건물명이 교회명과";
    else {
      picked = pickExactMatch(church.rawAddress, r.juso);
      if (picked) pickedBy = "원본 주소와 정확히";
    }
  }
  const j = picked ?? r.juso[0];
  const matched = {
    roadAddr: j.roadAddr,
    jibunAddr: j.jibunAddr,
    zipNo: j.zipNo,
    siNm: j.siNm,
    sggNm: j.sggNm,
    coordParams: {
      admCd: j.admCd,
      rnMgtSn: j.rnMgtSn,
      udrtYn: j.udrtYn,
      buldMnnm: String(j.buldMnnm),
      buldSlno: String(j.buldSlno),
    },
  };

  // 판정 순서가 곧 우선순위다. 먼저 걸리는 것이 사람에게 보고된다.
  if (r.total > 1 && !picked) {
    return { ...base, matched, status: "multiple", reason: `후보 ${r.total}건 — 어느 것인지 확인 필요` };
  }
  if (j.hstryYn === "1") {
    return { ...base, matched, status: "historical", reason: "변동된 옛 주소로 검색됨 — 원본이 낡았다" };
  }
  const apiRegion = normalizeRegion(j.siNm);
  if (apiRegion !== church.region) {
    return {
      ...base,
      matched,
      status: "regionMismatch",
      reason: `지역 어긋남 — 보유 '${church.region}' vs API '${apiRegion}'`,
    };
  }
  return {
    ...base,
    matched,
    status: "ok",
    reason: picked ? `후보 ${r.total}건 중 ${pickedBy} 일치하는 1건` : "정상",
  };
}

// 원본 주소로 조회한다. churches.json의 주소는 이미 정규화됐을 수 있어 쓰면 결과가 흔들린다.
const { rows } = readSource();
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const targets = only ? rows.filter((c) => c.name.includes(only)) : rows;

/**
 * 이전 결과를 읽어 둔다. 쓰는 곳이 둘이다.
 *
 * ① **좌표 이어받기** — 좌표는 `coordParams` 다섯 코드에서 결정론적으로 나오므로,
 *    그 다섯이 그대로면 다시 받아도 같은 값이다. 예전에는 이 파일을 통째로 새로
 *    쓰면서 좌표를 전부 버렸고, 교회 한 건을 고쳐도 좌표 API를 전량 다시 불렀다
 *    (89건 기준 87건이 같은 값으로 되돌아왔다 — 순수 낭비였다).
 * ② **`--only=` 안전** — 아래 병합이 없으면 일부만 돌렸을 때 나머지 교회 항목이
 *    파일에서 사라진다. 정규화 주소와 좌표가 함께 날아가므로 치명적이다.
 */
const previous: Entry[] = existsSync(OUTPUT)
  ? (JSON.parse(readFileSync(OUTPUT, "utf8")) as { entries?: Entry[] }).entries ?? []
  : [];
const previousById = new Map(previous.map((e) => [e.id, e]));

/** 좌표를 일부러 다시 받고 싶을 때. 캐리오버가 기본이 됐으므로 탈출구를 둔다 */
const refreshCoords = process.argv.includes("--refresh-coords");

/** `coordParams`가 그대로면 이전 좌표를 그대로 옮긴다 */
function carryCoord(entry: Entry): void {
  if (refreshCoords || !entry.matched) return;
  const before = previousById.get(entry.id)?.matched;
  if (!before?.coord) return;
  const same = COORD_KEYS.every(
    (k) => before.coordParams?.[k] === entry.matched!.coordParams[k],
  );
  if (same) entry.matched.coord = before.coord;
}

console.log(`대상 ${targets.length}건 · 요청 간격 ${DELAY_MS}ms · 예상 ${Math.ceil((targets.length * (DELAY_MS + 400)) / 60000)}분\n`);

const entries: Entry[] = [];
let trimmed = 0;
for (const [i, church] of targets.entries()) {
  if (i > 0) await sleep(DELAY_MS);
  let keywordUsed: string | undefined;
  let r = await search(church.rawAddress);

  // 원본 그대로 못 찾으면 건물명·층을 뗀 검색어로 한 번 더 시도한다.
  // 검색어만 다듬는 것이고 원본 주소는 그대로 둔다.
  if (!("error" in r) && r.total === 0) {
    const keyword = toAddressKeyword(church.rawAddress);
    if (keyword && keyword !== church.rawAddress) {
      await sleep(DELAY_MS);
      const retry = await search(keyword);
      if (!("error" in retry) && retry.total > 0) {
        r = retry;
        keywordUsed = keyword;
        trimmed++;
      }
    }
  }

  if ("error" in r) {
    entries.push({
      id: church.id,
      name: church.name,
      status: "apiError",
      reason: r.error,
      original: { address: church.rawAddress, region: church.region, subRegion: church.subRegion },
    });
    process.stdout.write("!");
    continue;
  }
  const entry = classify(church, r);
  if (keywordUsed) entry.keywordUsed = keywordUsed;
  // 건물이 그대로면 이전 좌표를 살린다 — 2단계가 다시 부를 일이 없어진다
  carryCoord(entry);
  entries.push(entry);
  process.stdout.write(entry.status === "ok" ? "." : entry.status === "notFound" ? "x" : "?");
}
console.log("\n");

const by = (s: Status) => entries.filter((e) => e.status === s);
const LABEL: Record<Status, string> = {
  ok: "정상",
  multiple: "다중 후보",
  historical: "낡은 주소",
  regionMismatch: "지역 어긋남",
  notFound: "검색 실패",
  apiError: "API 오류",
};

console.log("=".repeat(60));
console.log(
  (Object.keys(LABEL) as Status[]).map((s) => `${LABEL[s]} ${by(s).length}`).join(" · "),
);
console.log(`(검색어를 다듬어 찾아낸 것 ${trimmed}건)`);

// 좌표 캐리오버는 조용히 일어나므로 수치로 보여준다. 0으로 떨어지면 2단계가
// 전량을 다시 받게 된다는 뜻이라 눈에 띄어야 한다.
const carried = entries.filter((e) => e.matched?.coord).length;
const needCoord = entries.filter(
  (e) => e.status === "ok" && e.matched && !e.matched.coord,
).length;
console.log(
  refreshCoords
    ? `(--refresh-coords: 좌표를 이어받지 않았다 — 2단계가 ${needCoord}건을 다시 받는다)`
    : `(좌표 이어받음 ${carried}건 · 2단계가 새로 받을 것 ${needCoord}건)`,
);

// 새로 생긴 자동 판정이라 조용히 넘기지 않고 전부 보여준다.
// 사람이 눈으로 훑을 수 있어야 "자동은 어디까지"라는 경계가 유지된다.
const autoResolved = entries.filter((e) => e.status === "ok" && (e.totalCount ?? 0) > 1);
console.log(`(다중 후보에서 자동 확정한 것 ${autoResolved.length}건)`);
console.log("=".repeat(60));

if (autoResolved.length) {
  console.log(`\n■ 자동 확정 (${autoResolved.length}건) — 후보가 여럿이었으나 건물명 또는 주소가 유일하게 일치했다\n`);
  for (const e of autoResolved) {
    console.log(`  ${e.name} (${e.original.subRegion ?? e.original.region}) · ${e.reason}`);
    console.log(`    보유: ${e.original.address}`);
    console.log(`    확정: ${e.matched?.roadAddr}`);
  }
}

for (const s of ["apiError", "notFound", "multiple", "historical", "regionMismatch"] as Status[]) {
  const list = by(s);
  if (!list.length) continue;
  console.log(`\n■ ${LABEL[s]} (${list.length}건)\n`);
  for (const e of list) {
    console.log(`  ${e.name} (${e.original.subRegion ?? e.original.region})`);
    console.log(`    보유: ${e.original.address}`);
    if (e.matched) console.log(`    API : ${e.matched.roadAddr}`);
    console.log(`    사유: ${e.reason}`);
  }
}

/**
 * **`--only=`로 일부만 돌렸으면 나머지 항목을 그대로 남긴다.**
 * 전체를 돌렸을 때는 `entries`가 곧 현재 원본의 전부이므로, 원본에서 빠진 교회의
 * 항목은 함께 사라지는 것이 맞다(그대로 두면 지워진 교회가 파일에 영영 남는다).
 *
 * Map은 삽입 순서를 지키므로 기존 순서가 유지되고 새 교회만 뒤에 붙는다.
 */
const merged = (() => {
  if (!only) return entries;
  const byId = new Map(previous.map((e) => [e.id, e]));
  for (const e of entries) byId.set(e.id, e);
  return [...byId.values()];
})();

writeFileSync(
  OUTPUT,
  JSON.stringify(
    {
      note: "도로명주소 검색 API 조회 결과. import-source가 status가 'ok'인 건만 address를 roadAddr로 교체한다. 후보가 여럿이어도 원본과 글자까지 일치하는 것이 유일하면 ok로 확정한다(totalCount>1이면서 ok인 건이 그것이다). 그런 후보가 없거나 둘 이상이면 1순위가 맞다는 보장이 없어 multiple로 두고 원본을 유지한다. 좌표 단계는 coordParams를 그대로 쓴다. coordParams가 이전 실행과 같으면 좌표를 그대로 이어받으므로 주소를 다시 조회해도 좌표 API를 다시 부르지 않는다 — 일부러 다시 받으려면 --refresh-coords를 준다.",
      checkedAt: new Date().toISOString().slice(0, 10),
      entries: merged,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);
console.log(`\n결과 → ${OUTPUT}`);
console.log("※ 이 스크립트는 data/churches.json을 직접 수정하지 않는다.");
console.log("※ 반영은 npm run import:source가 한다 — status가 'ok'인 건만.");
