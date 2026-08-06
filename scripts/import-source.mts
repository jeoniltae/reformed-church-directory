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

const warnings: string[] = [];
const idCount = new Map<string, number>();
const churches: Church[] = [];

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

  if (phone && isSuspectPhone(phone)) {
    warnings.push(`전화번호 형식 확인 필요 → ${name}: ${phone}`);
  }

  const church: Church = {
    id,
    name,
    region: normalizeRegion(at(row, "지역")),
    address: normalizeAddress(at(row, "주소")),
    pastor: at(row, "담임목사"),
    source: SOURCE,
  };
  if (subRegion) church.subRegion = subRegion;
  if (denomination) church.denomination = denomination;
  if (phone) church.phone = normalizePhone(phone);
  if (homepage) church.homepage = normalizeUrl(homepage);

  churches.push(church);
}

// 화이트리스트에 없는 열이 원본에 있으면 알린다 (비고 등은 의도적으로 버린다)
const dropped = header.filter(
  (h) => h && !COLUMNS.includes(h as (typeof COLUMNS)[number]) && h !== "홈페이지",
);

writeFileSync(OUTPUT, JSON.stringify(churches, null, 2) + "\n", "utf8");

console.log(`${churches.length}건 → ${OUTPUT}`);
console.log(`버린 열: ${dropped.length ? dropped.join(", ") : "없음"}`);
if (warnings.length) {
  console.log(`\n확인 필요 ${warnings.length}건`);
  for (const w of warnings) console.log(`  · ${w}`);
}
