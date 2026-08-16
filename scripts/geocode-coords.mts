// 도로명주소 좌표제공 API로 좌표를 채운다 — geocode.json만 갱신하고 churches.json은 건드리지 않는다

import { readFileSync, writeFileSync } from "node:fs";
import { isWithinKorea, utmkToWgs84 } from "./lib/coords.mts";

// normalize:addresses가 만든 파일을 그대로 이어받는다.
// 거기 저장된 coordParams 덕분에 검색 API를 다시 부르지 않아도 된다.
const FILE = "data/geocode.json";
const ENDPOINT = "https://business.juso.go.kr/addrlink/addrCoordApi.do";
const DELAY_MS = 1000; // 준수 사항의 "초당 1건 이하"를 그대로 따른다
const TIMEOUT_MS = 15_000;

const KEY = process.env.JUSO_COORD_KEY;
if (!KEY) {
  console.error("JUSO_COORD_KEY가 없다. .env.local에 넣고 --env-file로 실행할 것.");
  console.error("  npm run geocode:coords");
  process.exit(1);
}

/** 검색 API가 남겨둔 코드 5개. 좌표 조회에 그대로 넘긴다 */
type CoordParams = {
  admCd: string;
  rnMgtSn: string;
  udrtYn: string;
  buldMnnm: string;
  buldSlno: string;
};

/**
 * geocode.json 항목 중 여기서 쓰는 것만 적는다.
 * 파일을 통째로 다시 만들지 않고 파싱한 객체를 제자리에서 고쳐 쓰므로,
 * 여기 없는 필드(jibunAddr·zipNo 등)도 그대로 보존된다.
 */
type Entry = {
  id: string;
  name: string;
  status: string;
  original: { address: string; region?: string; subRegion?: string };
  matched?: {
    roadAddr: string;
    coordParams: CoordParams;
    coord?: { lat: number; lng: number; entX: number; entY: number };
  };
};

type GeocodeFile = { entries: Entry[]; coordsCheckedAt?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchCoord(
  params: CoordParams,
): Promise<{ entX: number; entY: number } | { error: string }> {
  const url = `${ENDPOINT}?${new URLSearchParams({
    confmKey: KEY!,
    ...params,
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
    results?: {
      common?: { errorCode?: string; errorMessage?: string };
      juso?: { entX?: string; entY?: string }[] | null;
    };
  };
  const common = body.results?.common;
  if (common?.errorCode !== "0") {
    return { error: `${common?.errorCode} ${common?.errorMessage}` };
  }

  const j = body.results?.juso?.[0];
  if (!j) return { error: "응답에 좌표가 없다" };

  const entX = Number(j.entX);
  const entY = Number(j.entY);
  if (!Number.isFinite(entX) || !Number.isFinite(entY)) {
    return { error: `좌표를 숫자로 못 읽었다 (${j.entX}, ${j.entY})` };
  }
  return { entX, entY };
}

const file = JSON.parse(readFileSync(FILE, "utf8")) as GeocodeFile;
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

// status가 'ok'인 건만 다룬다. 다중 후보·검색 실패는 1순위가 맞다는 보장이 없어
// 좌표를 붙이면 엉뚱한 위치가 박힌다 — 주소 정규화와 같은 기준이다.
// 이미 좌표가 있으면 건너뛴다. 중간에 끊겨도 이어서 돌릴 수 있다.
const targets = file.entries.filter(
  (e) =>
    e.status === "ok" &&
    e.matched?.coordParams &&
    !e.matched.coord &&
    (!only || e.name.includes(only)),
);

const skipped = file.entries.filter((e) => e.status !== "ok").length;
const already = file.entries.filter((e) => e.matched?.coord).length;

console.log(
  `대상 ${targets.length}건 · 이미 있음 ${already}건 · 대상 아님 ${skipped}건(status≠ok)`,
);
console.log(
  `요청 간격 ${DELAY_MS}ms · 예상 ${Math.ceil((targets.length * (DELAY_MS + 400)) / 60000)}분\n`,
);

const failures: { name: string; reason: string }[] = [];
let filled = 0;

for (const [i, entry] of targets.entries()) {
  if (i > 0) await sleep(DELAY_MS);
  process.stdout.write(`\r  ${i + 1}/${targets.length}  ${entry.name}`.padEnd(60));

  const result = await fetchCoord(entry.matched!.coordParams);
  if ("error" in result) {
    failures.push({ name: entry.name, reason: result.error });
    continue;
  }

  const { lat, lng } = utmkToWgs84(result.entX, result.entY);
  // 좌표계를 잘못 잡거나 API가 이상값을 주면 그럴듯한 좌표가 나온다. 여기서 막는다.
  if (!isWithinKorea({ lat, lng })) {
    failures.push({ name: entry.name, reason: `국내 범위 밖 (${lat}, ${lng})` });
    continue;
  }

  entry.matched!.coord = { lat, lng, entX: result.entX, entY: result.entY };
  filled++;
}

console.log("\n");
console.log("=".repeat(60));
console.log(`좌표 확보 ${filled}건 · 실패 ${failures.length}건`);
console.log("=".repeat(60));

if (failures.length) {
  console.log("\n■ 실패 (사람이 확인할 것)\n");
  for (const f of failures) console.log(`  ${f.name}\n    사유: ${f.reason}`);
}

file.coordsCheckedAt = new Date().toISOString();
writeFileSync(FILE, `${JSON.stringify(file, null, 2)}\n`, "utf8");

console.log(`\n결과 → ${FILE}`);
console.log("※ 이 스크립트는 data/churches.json을 직접 수정하지 않는다.");
console.log("※ 반영은 npm run import:source가 한다 — 주소가 낡지 않은 건만.");
