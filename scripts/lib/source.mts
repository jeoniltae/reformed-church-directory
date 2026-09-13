// 원본 CSV + 신규 등록 + 사람 교정을 읽어 가공 전 레코드를 만든다.
// import-source와 normalize-addresses가 같은 입력을 보게 해 파이프라인 순환을 막는다.

import { readFileSync } from "node:fs";
import {
  normalizeAddress,
  normalizeRegion,
  toChurchId,
} from "../../src/lib/church-utils.ts";

const CSV = "data/raw/추천교회.CSV";
const ADDRESS_FIXES = "data/address-fixes.json";
const ADDITIONS = "data/additions.json";
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
  /**
   * **원본 값으로 만든 조회용 id.** data/address-fixes.json의 키이며,
   * 교회명·시군구를 교정하면 출력 id와 달라진다 — 둘을 헷갈리면 교정이 조용히 무시된다.
   */
  lookupId: string;
  name: string;
  region: string;
  subRegion: string;
  /** CSV 주소에 사람 교정을 얹은 값. 도로명주소 조회의 입력이다 */
  rawAddress: string;
  pastor: string;
  denomination: string;
  phone: string;
  /**
   * CSV 원본 그대로다. 다른 항목과 달리 교정을 얹지 않는다 —
   * import-source가 이 값으로 죽은 링크 판정을 해야 매칭 집계가 어긋나지 않는다.
   */
  homepage: string;
  /** 이전한 홈페이지 주소. 있으면 원본 대신 이 값을 싣는다 */
  homepageCorrected: string;
  /** 사람이 교정한 항목 (반영 건수 집계용) */
  fixed: {
    address: boolean;
    phone: boolean;
    pastor: boolean;
    homepage: boolean;
    name: boolean;
    subRegion: boolean;
    region: boolean;
  };
};

/**
 * data/additions.json의 한 행. CSV 열과 같은 층위의 **원본 표기**이며
 * 정규화는 아래 buildRows가 CSV 행과 똑같이 처리한다.
 */
export type AdditionRow = {
  region: string;
  subRegion: string;
  name: string;
  pastor: string;
  denomination: string;
  phone: string;
  address: string;
  homepage?: string;
};

export type Fix = {
  /** **CSV 값으로 만든 조회용 id다.** 교회명·시군구를 교정하면 출력 id는 달라진다 */
  id: string;
  corrected?: string;
  phoneCorrected?: string;
  pastorCorrected?: string;
  homepageCorrected?: string;
  nameCorrected?: string;
  subRegionCorrected?: string;
  regionCorrected?: string;
};

/** CSV 행과 additions 행을 같은 모양으로 맞춘 중간 표현. 출처를 구분하지 않는다 */
type RawRecord = {
  name: string;
  subRegion: string;
  region: string;
  address: string;
  pastor: string;
  denomination: string;
  phone: string;
  homepage: string;
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

/**
 * 순수 변환. 파일을 읽지 않으므로 단위 테스트로 고정할 수 있다 —
 * id 충돌 카운터와 교정 적용 순서가 여기 전부 들어 있다.
 */
export function buildRows(input: {
  header: string[];
  body: string[][];
  additions: readonly AdditionRow[];
  fixes: Map<string, Fix>;
}): { rows: SourceRow[]; addedCount: number } {
  const { header, body, additions, fixes } = input;

  const fixOf = (id: string, key: keyof Omit<Fix, "id">) => {
    const v = fixes.get(id)?.[key]?.trim();
    return v ? v : undefined;
  };

  const at = (row: string[], column: string) => {
    const i = header.indexOf(column);
    return i === -1 ? "" : (row[i] ?? "").trim();
  };

  const trim = (v: string | undefined) => (v ?? "").trim();

  // 아래 변환은 출처를 구분하지 않는다. 그래야 id 충돌 카운터와 사람 교정이
  // CSV 행과 신규 등록 행에 똑같이 걸린다.
  const records: RawRecord[] = [
    ...body.map((row) => ({
      name: at(row, "교회명"),
      subRegion: at(row, "sub-지역"),
      region: at(row, "지역"),
      address: at(row, "주소"),
      pastor: at(row, "담임목사"),
      denomination: at(row, "교단"),
      phone: at(row, "전화번호"),
      homepage: at(row, "홈페이지"),
    })),
    // **신규 등록은 CSV 행 뒤에 붙인다.** 앞에 끼우면 이름이 겹칠 때 -2가
    // 기존 교회 쪽에 붙어 이미 색인된 상세 URL이 통째로 바뀐다.
    ...additions.map((a) => ({
      name: trim(a.name),
      subRegion: trim(a.subRegion),
      region: trim(a.region),
      address: trim(a.address),
      pastor: trim(a.pastor),
      denomination: trim(a.denomination),
      phone: trim(a.phone),
      homepage: trim(a.homepage),
    })),
  ];

  const idCount = new Map<string, number>();
  const rows: SourceRow[] = records.map((rec) => {
    // address-fixes.json의 키는 원본 값으로 만든 id다. 교정을 찾으려면 이걸 먼저 만든다.
    let lookupId = toChurchId(rec.name, rec.subRegion);
    const seen = idCount.get(lookupId) ?? 0;
    idCount.set(lookupId, seen + 1);
    if (seen > 0) lookupId = `${lookupId}-${seen + 1}`;

    const fixedAddress = fixOf(lookupId, "corrected");
    const fixedPhone = fixOf(lookupId, "phoneCorrected");
    const fixedPastor = fixOf(lookupId, "pastorCorrected");
    const fixedHomepage = fixOf(lookupId, "homepageCorrected");
    const fixedName = fixOf(lookupId, "nameCorrected");
    const fixedSubRegion = fixOf(lookupId, "subRegionCorrected");
    const fixedRegion = fixOf(lookupId, "regionCorrected");

    // 교회를 식별하는 값이 바뀌면 id도 따라 바뀐다. URL과 geocode 키가 함께 움직인다.
    const id =
      fixedName || fixedSubRegion
        ? toChurchId(fixedName ?? rec.name, fixedSubRegion ?? rec.subRegion)
        : lookupId;

    return {
      id,
      lookupId,
      name: fixedName ?? rec.name,
      region: normalizeRegion(fixedRegion ?? rec.region),
      subRegion: fixedSubRegion ?? rec.subRegion,
      rawAddress: fixedAddress ?? normalizeAddress(rec.address),
      pastor: fixedPastor ?? rec.pastor,
      denomination: rec.denomination,
      phone: fixedPhone ?? rec.phone,
      homepage: rec.homepage,
      homepageCorrected: fixedHomepage ?? "",
      fixed: {
        address: Boolean(fixedAddress),
        phone: Boolean(fixedPhone),
        pastor: Boolean(fixedPastor),
        homepage: Boolean(fixedHomepage),
        name: Boolean(fixedName),
        subRegion: Boolean(fixedSubRegion),
        region: Boolean(fixedRegion),
      },
    };
  });

  // 교회명 교정으로 만들어진 id는 위 중복 카운터를 거치지 않으므로 여기서 확인한다.
  // 중복이 생기면 두 교회가 같은 URL을 갖게 되어 상세 페이지 하나가 사라진다.
  const seenIds = new Set<string>();
  for (const r of rows) {
    if (seenIds.has(r.id)) {
      throw new Error(
        `id 중복: ${r.id} (${r.name}) — address-fixes.json의 nameCorrected·subRegionCorrected를 확인할 것`,
      );
    }
    seenIds.add(r.id);
  }

  return { rows, addedCount: additions.length };
}

export function readSource(): {
  rows: SourceRow[];
  droppedColumns: string[];
  addedCount: number;
} {
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

  // 원본 CSV 이후에 추가된 교회. CSV를 고치지 않는 대신 여기에 쌓인다.
  const additions = (
    JSON.parse(readFileSync(ADDITIONS, "utf8")) as { churches: AdditionRow[] }
  ).churches;

  const { rows, addedCount } = buildRows({ header, body, additions, fixes });

  const droppedColumns = header.filter(
    (h) =>
      h &&
      !COLUMNS.includes(h as (typeof COLUMNS)[number]) &&
      h !== "홈페이지",
  );

  return { rows, droppedColumns, addedCount };
}
