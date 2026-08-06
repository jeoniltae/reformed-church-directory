// 교회 데이터 정규화 유틸 — 크롤러와 앱이 함께 쓰는 순수 함수 모음

/** 시도 표기를 접미사 없는 형태로 통일한다 (`서울시`·`경기도` → `서울`·`경기`) */
export function normalizeRegion(raw: string): string {
  const v = raw.trim().replace(/\s+/g, "");
  if (!v) return "";
  const stripped = v.replace(/(특별자치시|특별자치도|광역시|특별시|시|도)$/, "");
  return stripped.length >= 2 ? stripped : v;
}

/** 주소 앞에 붙은 우편번호를 떼고 공백을 정리한다 */
export function normalizeAddress(raw: string): string {
  return raw
    .trim()
    .replace(/^\d{3}\s*-?\s*\d{2,3}\s+/, "")
    .replace(/\s+/g, " ");
}

function splitPhone(raw: string): [string, string, string] | null {
  const d = raw.replace(/\D/g, "");

  // 010은 항상 11자리다. 한 자리 모자란 번호를 10자리 지역번호로 오인해 붙이면
  // 존재하지 않는 번호가 그럴듯한 모습으로 저장된다.
  if (d.startsWith("010")) {
    return d.length === 11 ? ["010", d.slice(3, 7), d.slice(7)] : null;
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
