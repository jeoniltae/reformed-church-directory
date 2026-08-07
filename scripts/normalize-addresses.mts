// 도로명주소 검색 API로 보유 주소를 진단한다 — 보고만 하고 churches.json은 건드리지 않는다

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { normalizeRegion, toAddressKeyword } from "../src/lib/church-utils.ts";
import type { Church } from "../src/types/church.ts";

const INPUT = "data/churches.json";
const OUTPUT = "data/reports/address-check.json";
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
  };
  totalCount?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(keyword: string): Promise<{ total: number; juso: Juso[] } | { error: string }> {
  const url = `${ENDPOINT}?${new URLSearchParams({
    confmKey: KEY!,
    currentPage: "1",
    countPerPage: "10",
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

function classify(church: Church, r: { total: number; juso: Juso[] }): Entry {
  const base = {
    id: church.id,
    name: church.name,
    original: { address: church.address, region: church.region, subRegion: church.subRegion },
    totalCount: r.total,
  };

  if (r.total === 0 || r.juso.length === 0) {
    return { ...base, status: "notFound", reason: "검색 결과 없음" };
  }

  const j = r.juso[0];
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
  if (r.total > 1) {
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
  return { ...base, matched, status: "ok", reason: "정상" };
}

const churches: Church[] = JSON.parse(readFileSync(INPUT, "utf8"));
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const targets = only ? churches.filter((c) => c.name.includes(only)) : churches;

console.log(`대상 ${targets.length}건 · 요청 간격 ${DELAY_MS}ms · 예상 ${Math.ceil((targets.length * (DELAY_MS + 400)) / 60000)}분\n`);

const entries: Entry[] = [];
let trimmed = 0;
for (const [i, church] of targets.entries()) {
  if (i > 0) await sleep(DELAY_MS);
  let keywordUsed: string | undefined;
  let r = await search(church.address);

  // 원본 그대로 못 찾으면 건물명·층을 뗀 검색어로 한 번 더 시도한다.
  // 검색어만 다듬는 것이고 원본 주소는 그대로 둔다.
  if (!("error" in r) && r.total === 0) {
    const keyword = toAddressKeyword(church.address);
    if (keyword && keyword !== church.address) {
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
      original: { address: church.address, region: church.region, subRegion: church.subRegion },
    });
    process.stdout.write("!");
    continue;
  }
  const entry = classify(church, r);
  if (keywordUsed) entry.keywordUsed = keywordUsed;
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
console.log("=".repeat(60));

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

mkdirSync("data/reports", { recursive: true });
writeFileSync(OUTPUT, JSON.stringify(entries, null, 2) + "\n", "utf8");
console.log(`\n상세 → ${OUTPUT}`);
console.log("※ 이 스크립트는 보고만 한다. data/churches.json은 수정하지 않는다.");
console.log("※ 좌표 단계(2단계)는 이 파일의 coordParams를 읽어 쓴다 — 재검색이 필요 없다.");
