// 교회 목록 검색·필터 순수 함수 — 클라이언트에서 돌므로 node:fs에 의존하지 않는다

import type { Church } from "@/types/church";

export interface ChurchQuery {
  /** 교회명·주소·담임목사·지역에 부분 일치. 공백은 무시한다 */
  q?: string;
  /** 시도 단위. 비어 있으면 전체 */
  region?: string;
  /**
   * 교단 묶음(`denominationGroup`). 비어 있으면 전체.
   * **`denomination`이 아니라 묶음으로 거른다** — 배지 값은 19종이라 칩으로 쓸 수 없다.
   * 교단이 없는 6건은 어느 묶음에도 속하지 않아 `전체`에서만 보인다.
   */
  denominationGroup?: string;
}

/** 검색어와 대상 문자열을 같은 기준으로 눕힌다 — 공백 제거 + 소문자 */
function squash(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function filterChurches(
  churches: Church[],
  { q, region, denominationGroup }: ChurchQuery,
): Church[] {
  const needle = squash(q ?? "");

  return churches.filter((church) => {
    if (region && church.region !== region) return false;
    if (denominationGroup && church.denominationGroup !== denominationGroup) {
      return false;
    }
    if (!needle) return true;

    // 필드를 이어붙이면 경계를 넘는 헛일치가 생기므로 각각 따로 본다
    return [church.name, church.address, church.pastor, church.region].some(
      (field) => squash(field).includes(needle),
    );
  });
}

export interface RegionCount {
  region: string;
  count: number;
}

/** 실제 데이터에 등장하는 지역과 그 건수를, 건수 내림차순으로 돌려준다 */
export function collectRegionCounts(churches: Church[]): RegionCount[] {
  const counts = new Map<string, number>();
  for (const church of churches) {
    counts.set(church.region, (counts.get(church.region) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([region, count]) => ({ region, count }));
}

/** 실제 데이터에 등장하는 지역만, 건수 내림차순으로 돌려준다 */
export function collectRegions(churches: Church[]): string[] {
  return collectRegionCounts(churches).map(({ region }) => region);
}

/**
 * 실제 데이터에 등장하는 교단 묶음만, 건수 내림차순으로 돌려준다.
 *
 * **값이 없는 교회는 세지 않는다.** 교단이 없는 6건에 `교단 없음` 칩을 만들지 않는
 * 것은 의도다 — 칩이 하나 늘어 Seed `which-input` 기준(7개)을 넘고, 무엇보다
 * 그 자체로 찾아볼 만한 묶음이 아니다. 그 6건은 `전체`에서만 보인다.
 */
export function collectDenominationGroups(churches: Church[]): string[] {
  const counts = new Map<string, number>();
  for (const { denominationGroup } of churches) {
    if (!denominationGroup) continue;
    counts.set(denominationGroup, (counts.get(denominationGroup) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([group]) => group);
}
