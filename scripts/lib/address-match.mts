// 도로명주소 API가 후보를 여럿 돌려줬을 때 원본과 같은 곳을 가리키는 것을 골라낸다.
// 스크립트 전용이다 — 앱은 구워진 주소만 읽으므로 이 판정을 알 필요가 없다.

import { normalizeRegion, toAddressKeyword } from "../../src/lib/church-utils.ts";

/** 비교에 쓰는 후보의 최소 형태. API 응답에서 이 두 필드만 본다 */
export type AddressCandidate = {
  roadAddr: string;
  jibunAddr: string;
};

/**
 * 주소 두 개가 같은 곳인지 비교하기 위한 키.
 *
 * 같은 주소도 소스마다 글자가 다르게 나와서 그대로 비교하면 전부 어긋난다.
 * 실측으로 확인한 차이가 둘이다.
 * - 시도 표기 — 보유 데이터는 `경남`, API는 `경상남도`
 * - 도로명 띄어쓰기 — 보유 데이터는 `사림로 130번길`, API는 `사림로130번길`
 *
 * 그래서 시도를 축약형으로 통일하고 공백을 전부 지운다. 건물명·층·호는
 * `toAddressKeyword`가 이미 잘라낸다.
 */
export function addressKey(raw: string): string {
  const keyword = toAddressKeyword(raw);
  if (!keyword) return "";

  // 첫 토큰만 시도로 보고 정규화한다. 시도가 없는 주소면 표에 없는 값이라
  // normalizeRegion이 그대로 돌려주므로 그냥 붙는다.
  const [head, ...rest] = keyword.split(" ");
  return (normalizeRegion(head) + rest.join("")).replace(/\s+/g, "");
}

/**
 * 후보 중 원본 주소와 글자 그대로 일치하는 것을 찾는다.
 *
 * **유일할 때만 돌려준다.** 이건 후보를 고르는 것이 아니라 알아보는 것이라
 * "자동은 불일치 탐지까지만" 원칙에 걸리지 않는다 — 후보가 하나뿐일 때
 * roadAddr을 그대로 반영하는 것이 이미 허용돼 있는 것과 같은 이유다.
 * 둘 이상 일치하면 한 지번에 건물이 여럿인 진짜 모호한 경우라 사람에게 넘긴다.
 */
export function pickExactMatch<T extends AddressCandidate>(
  raw: string,
  candidates: readonly T[],
): T | null {
  const key = addressKey(raw);
  if (!key) return null;

  const hits = candidates.filter(
    (c) => addressKey(c.roadAddr) === key || addressKey(c.jibunAddr) === key,
  );
  return hits.length === 1 ? hits[0] : null;
}
