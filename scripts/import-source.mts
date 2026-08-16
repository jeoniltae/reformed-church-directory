// 원본 CSV를 data/churches.json으로 변환한다 — 오프라인 배치, 앱 런타임과 분리

import { readFileSync, writeFileSync } from "node:fs";
import {
  isSuspectPhone,
  normalizePhone,
  normalizeUrl,
} from "../src/lib/church-utils.ts";
import type { Church } from "../src/types/church.ts";
import { readSource } from "./lib/source.mts";

const OUTPUT = "data/churches.json";
const DEAD_LINKS = "data/dead-links.json";
const GEOCODE = "data/geocode.json";
const SOURCE = "자체 수집";

// 생존 확인에서 죽은 것으로 판정된 URL. 원본 CSV를 고치지 않으므로
// 이 목록이 없으면 다음 변환에서 되살아난다.
const deadLinks = new Set<string>(
  (JSON.parse(readFileSync(DEAD_LINKS, "utf8")) as { links: { url: string }[] }).links.map(
    (l) => l.url,
  ),
);

// 도로명주소 API 조회 결과. status가 'ok'인 건만 주소를 교체한다.
// 다중 후보·검색 실패는 1순위가 맞다는 보장이 없어 원본을 유지한다.
type Geo = {
  id: string;
  status: string;
  original: { address: string };
  // coord는 geocode:coords가 채운다. 주소와 같은 조회에서 나온 값이라 낡음 판정도 같이 받는다
  matched?: { roadAddr: string; coord?: { lat: number; lng: number } };
};
const geocode = new Map<string, Geo>(
  (JSON.parse(readFileSync(GEOCODE, "utf8")) as { entries: Geo[] }).entries.map((g) => [
    g.id,
    g,
  ]),
);

const { rows, droppedColumns } = readSource();

const warnings: string[] = [];
const churches: Church[] = [];
const fixedCount = { address: 0, phone: 0, pastor: 0 };
let droppedLinks = 0;
let normalizedAddresses = 0;
let withCoords = 0;

for (const row of rows) {
  if (row.fixed.address) fixedCount.address++;
  if (row.fixed.phone) fixedCount.phone++;
  if (row.fixed.pastor) fixedCount.pastor++;

  // 조회는 rawAddress로 했다. 그 사이 주소가 바뀌었으면 낡은 결과로 덮어쓰지 않는다.
  let address = row.rawAddress;
  let coord: { lat: number; lng: number } | undefined;
  const geo = geocode.get(row.id);
  if (geo?.status === "ok" && geo.matched) {
    if (geo.original.address === row.rawAddress) {
      address = geo.matched.roadAddr;
      normalizedAddresses++;
      // 좌표는 이 주소에 대해 조회한 것이므로 주소가 낡지 않았을 때만 함께 반영한다
      coord = geo.matched.coord;
    } else {
      warnings.push(
        `geocode 결과가 낡음 → ${row.name}: 재조회 필요 (npm run normalize:addresses)`,
      );
    }
  }

  const church: Church = {
    id: row.id,
    name: row.name,
    region: row.region,
    address,
    pastor: row.pastor,
    source: SOURCE,
  };
  if (coord) {
    church.lat = coord.lat;
    church.lng = coord.lng;
    withCoords++;
  }
  if (row.subRegion) church.subRegion = row.subRegion;
  if (row.denomination) church.denomination = row.denomination;
  if (row.phone) {
    church.phone = normalizePhone(row.phone);
    if (isSuspectPhone(row.phone)) {
      warnings.push(`전화번호 형식 확인 필요 → ${row.name}: ${row.phone}`);
    }
  }
  if (row.homepage) {
    const url = normalizeUrl(row.homepage);
    if (deadLinks.has(url)) droppedLinks++;
    else church.homepage = url;
  }

  churches.push(church);
}

writeFileSync(OUTPUT, JSON.stringify(churches, null, 2) + "\n", "utf8");

console.log(`${churches.length}건 → ${OUTPUT}`);
console.log(`버린 열: ${droppedColumns.length ? droppedColumns.join(", ") : "없음"}`);
console.log(
  `죽은 링크로 비운 homepage: ${droppedLinks}건 (등록 ${deadLinks.size}건, ${DEAD_LINKS})`,
);
console.log(
  `사람이 교정한 값: 주소 ${fixedCount.address} · 전화 ${fixedCount.phone} · 담임목사 ${fixedCount.pastor}`,
);
console.log(
  `도로명주소로 정규화: ${normalizedAddresses}건 / ${geocode.size}건 조회  (${GEOCODE})`,
);
console.log(`좌표 반영: ${withCoords}건 / ${churches.length}건`);
if (droppedLinks !== deadLinks.size) {
  warnings.push(
    `dead-links.json의 URL ${deadLinks.size - droppedLinks}건이 원본과 매칭되지 않았다 — 오타 또는 원본 변경`,
  );
}
if (warnings.length) {
  console.log(`\n확인 필요 ${warnings.length}건`);
  for (const w of warnings) console.log(`  · ${w}`);
}
