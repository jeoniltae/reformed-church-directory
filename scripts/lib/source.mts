// 원본 CSV + 사람 교정을 읽어 가공 전 레코드를 만든다.
// import-source와 normalize-addresses가 같은 입력을 보게 해 파이프라인 순환을 막는다.

import { readFileSync } from "node:fs";
import {
  normalizeAddress,
  normalizeRegion,
  toChurchId,
} from "../../src/lib/church-utils.ts";

const CSV = "data/raw/추천교회.CSV";
const ADDRESS_FIXES = "data/address-fixes.json";
const HEADER_ROW = 3; // 1행 제목, 2행 빈 줄

/** 수록할 열만 화이트리스트로 뽑는다. 비고는 자유서술이라 제외한다 */
export const COLUMNS = [
  "지역",
  "sub-지역",
  "교회명",
  "담임목사",
  "교단",
  "전화번호",
  "주소",
] as const;

export type SourceRow = {
  id: string;
  name: string;
  region: string;
  subRegion: string;
  /** CSV 주소에 사람 교정을 얹은 값. 도로명주소 조회의 입력이다 */
  rawAddress: string;
  pastor: string;
  denomination: string;
  phone: string;
  homepage: string;
  /** 사람이 교정한 항목 (반영 건수 집계용) */
  fixed: { address: boolean; phone: boolean; pastor: boolean };
};

export function parseCsv(text: string): string[][] {
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

type Fix = {
  id: string;
  corrected?: string;
  phoneCorrected?: string;
  pastorCorrected?: string;
};

export function readSource(): { rows: SourceRow[]; droppedColumns: string[] } {
  const table = parseCsv(new TextDecoder("euc-kr").decode(readFileSync(CSV)));
  const header = table[HEADER_ROW - 1].map((h) => h.trim());
  const body = table
    .slice(HEADER_ROW)
    .filter((r) => r.some((c) => c && c.trim() !== ""));

  const fixes = new Map<string, Fix>(
    (JSON.parse(readFileSync(ADDRESS_FIXES, "utf8")) as { fixes: Fix[] }).fixes.map(
      (f) => [f.id, f],
    ),
  );
  const fixOf = (id: string, key: keyof Omit<Fix, "id">) => {
    const v = fixes.get(id)?.[key]?.trim();
    return v ? v : undefined;
  };

  const at = (row: string[], column: string) => {
    const i = header.indexOf(column);
    return i === -1 ? "" : (row[i] ?? "").trim();
  };

  const idCount = new Map<string, number>();
  const rows: SourceRow[] = body.map((row) => {
    const name = at(row, "교회명");
    const subRegion = at(row, "sub-지역");

    let id = toChurchId(name, subRegion);
    const seen = idCount.get(id) ?? 0;
    idCount.set(id, seen + 1);
    if (seen > 0) id = `${id}-${seen + 1}`;

    const fixedAddress = fixOf(id, "corrected");
    const fixedPhone = fixOf(id, "phoneCorrected");
    const fixedPastor = fixOf(id, "pastorCorrected");

    return {
      id,
      name,
      region: normalizeRegion(at(row, "지역")),
      subRegion,
      rawAddress: fixedAddress ?? normalizeAddress(at(row, "주소")),
      pastor: fixedPastor ?? at(row, "담임목사"),
      denomination: at(row, "교단"),
      phone: fixedPhone ?? at(row, "전화번호"),
      homepage: at(row, "홈페이지"),
      fixed: {
        address: Boolean(fixedAddress),
        phone: Boolean(fixedPhone),
        pastor: Boolean(fixedPastor),
      },
    };
  });

  const droppedColumns = header.filter(
    (h) =>
      h &&
      !COLUMNS.includes(h as (typeof COLUMNS)[number]) &&
      h !== "홈페이지",
  );

  return { rows, droppedColumns };
}
