// 교회 데이터 정규화 유틸 — 크롤러와 앱이 함께 쓰는 순수 함수 모음

/**
 * 시도 정식명과 축약형의 대응표.
 * 접미사만 떼는 방식으로는 `충청북도` → `충북`을 얻을 수 없어 명시적으로 둔다.
 * 도로명주소 API가 돌려주는 `siNm`과 보유 데이터의 `region`을 맞추는 데 쓴다.
 */
const SIDO: readonly (readonly string[])[] = [
  ["서울", "서울특별시"],
  ["부산", "부산광역시"],
  ["대구", "대구광역시"],
  ["인천", "인천광역시"],
  ["대전", "대전광역시"],
  ["울산", "울산광역시"],
  ["세종", "세종특별자치시"],
  ["경기", "경기도"],
  ["강원", "강원도", "강원특별자치도"],
  ["충북", "충청북도"],
  ["충남", "충청남도"],
  ["전북", "전라북도", "전북특별자치도"],
  // 광주광역시와 전라남도가 통합됐다. 도로명주소 API가 두 지역 모두
  // `전남광주통합특별시`로 돌려주는 것을 확인하고 통합 명칭을 따르기로 했다.
  // 축약형 `전남광주`는 이 프로젝트가 정한 것이며 공식 약칭이 아니다.
  ["전남광주", "전남광주통합특별시", "전남", "전라남도", "광주", "광주광역시"],
  ["경북", "경상북도"],
  ["경남", "경상남도"],
  ["제주", "제주도", "제주특별자치도"],
];

/** 시도 표기를 축약형으로 통일한다 (`서울특별시`·`충청북도` → `서울`·`충북`) */
export function normalizeRegion(raw: string): string {
  const v = raw.trim().replace(/\s+/g, "");
  if (!v) return "";

  for (const names of SIDO) {
    if (names.includes(v)) return names[0];
  }
  // `서울시`·`광주시`처럼 표에 없는 축약 변형은 접미사를 떼고 다시 찾는다
  const stripped = v.replace(/(특별자치시|특별자치도|광역시|특별시|시|도)$/, "");
  for (const names of SIDO) {
    if (names.includes(stripped)) return names[0];
  }
  return stripped.length >= 2 ? stripped : v;
}

/** 주소 앞에 붙은 우편번호를 떼고 공백을 정리한다 */
export function normalizeAddress(raw: string): string {
  return raw
    .trim()
    .replace(/^\d{3}\s*-?\s*\d{2,3}\s+/, "")
    .replace(/\s+/g, " ");
}

/**
 * 도로명주소 검색 API에 넘길 검색어를 만든다.
 *
 * 건물명·층·호가 붙으면 검색이 실패한다(실측 28건 중 16건이 이 경우다).
 * 번지·건물번호까지만 남기고 뒤를 잘라낸다.
 * **원본 주소를 고치는 것이 아니라 검색어만 다듬는다.**
 */
export function toAddressKeyword(raw: string): string {
  const v = normalizeAddress(raw)
    .replace(/\([^)]*\)/g, " ") // 괄호 부기 — "(신이문역 1번출구 근처)"
    .replace(/\?/g, " ") // 원본에 섞인 깨진 문자
    .replace(/(\d)번지/g, "$1") // "445번지" → "445"
    .replace(/\s+/g, " ")
    .trim();

  // 도로명(로·길) 또는 지번(동·리·가)에 이어지는 번호까지만 취한다.
  // 번호 바로 뒤에 한글이 오면 법정동 이름의 일부다("당산동6가") — 거기서 끊지 않는다.
  const m = v.match(/^(.*?(?:로|길|동|리|가)\s*\d+(?:-\d+)?)(?![가-힣])/);
  return (m ? m[1] : v).replace(/\s+/g, " ").trim();
}

function splitPhone(raw: string): [string, string, string] | null {
  const d = raw.replace(/\D/g, "");

  // 010은 항상 11자리다. 한 자리 모자란 번호를 10자리 지역번호로 오인해 붙이면
  // 존재하지 않는 번호가 그럴듯한 모습으로 저장된다.
  if (d.startsWith("010")) {
    return d.length === 11 ? ["010", d.slice(3, 7), d.slice(7)] : null;
  }
  // 050X 안심번호는 앞자리가 네 자리다 (0507-1234-5678 / 0505-123-4567)
  if (/^050\d/.test(d)) {
    return d.length === 11 || d.length === 12
      ? [d.slice(0, 4), d.slice(4, -4), d.slice(-4)]
      : null;
  }
  // 서울은 지역번호가 두 자리다
  if (d.startsWith("02")) {
    return d.length === 9 || d.length === 10
      ? ["02", d.slice(2, -4), d.slice(-4)]
      : null;
  }
  if (/^0\d{2}/.test(d) && (d.length === 10 || d.length === 11)) {
    return [d.slice(0, 3), d.slice(3, -4), d.slice(-4)];
  }
  return null;
}

/**
 * 전화번호를 `02-123-4567` 형태로 통일한다.
 * 알려진 자릿수에 맞지 않으면 원본을 그대로 돌려준다 — 임의로 고치지 않는다.
 */
export function normalizePhone(raw: string): string {
  const parts = splitPhone(raw);
  return parts ? parts.join("-") : raw.trim();
}

/** 정규화로 고칠 수 없는 전화번호인지 판정한다 (사람 확인 대상) */
export function isSuspectPhone(raw: string): boolean {
  return splitPhone(raw) === null;
}

/** 스킴이 없는 URL에 `http://`를 붙인다. 기존 스킴은 바꾸지 않는다 */
export function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `http://${v}`;
}

/** 교회명과 시군구로 URL 식별자를 만든다 */
export function toChurchId(name: string, subRegion?: string): string {
  const slug = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^가-힣a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  const base = slug(name);
  const sub = subRegion ? slug(subRegion) : "";
  return sub ? `${base}-${sub}` : base;
}
