// 교회별 `최종 수정` 날짜를 계산한다 — import:source가 data/updated-dates.json을 갱신할 때 쓴다
//
// **날짜는 사실 정보가 바뀐 날이다. 확인한 날이 아니다.** 값이 그대로면 움직이지 않고,
// 좌표·교단 묶음·안내는 비교하지 않는다 — 일괄 재분류나 좌표 재조회가 수정으로 찍히면
// 화면의 `최종 수정`이 거짓이 된다.

import type { Church } from "../../src/types/church.ts";

const FACT_FIELDS = ["name", "address", "phone", "pastor", "homepage", "denomination"] as const;

function factsChanged(before: Church, after: Church): boolean {
  return FACT_FIELDS.some((field) => (before[field] ?? "") !== (after[field] ?? ""));
}

/**
 * 새 원장을 돌려준다. 키는 `next` 순서라 입력이 같으면 파일도 글자까지 같다.
 *
 * - 사실 필드가 바뀐 교회와 원장에 없는 교회는 `today`를 받는다
 * - `next`에 없는 id의 행은 사라진다 (개명·이전·삭제 요청)
 * - `previous`가 `null`이면 비교할 것이 없으므로 원장 값을 그대로 둔다
 */
export function stampUpdatedDates(
  previous: readonly Church[] | null,
  next: readonly Church[],
  ledger: Readonly<Record<string, string>>,
  today: string,
): Record<string, string> {
  const before = new Map(previous?.map((church) => [church.id, church]));
  const dates: Record<string, string> = {};
  for (const church of next) {
    const prior = before.get(church.id);
    const changed = prior !== undefined && factsChanged(prior, church);
    dates[church.id] = changed ? today : (ledger[church.id] ?? today);
  }
  return dates;
}
