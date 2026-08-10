// 교회 목록 검색·필터 순수 함수 — 클라이언트에서 돌므로 node:fs에 의존하지 않는다

import type { Church } from "@/types/church";

export interface ChurchQuery {
  /** 교회명·주소·담임목사·지역에 부분 일치. 공백은 무시한다 */
  q?: string;
  /** 시도 단위. 비어 있으면 전체 */
  region?: string;
}

/** 검색어와 대상 문자열을 같은 기준으로 눕힌다 — 공백 제거 + 소문자 */
function squash(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function filterChurches(
  churches: Church[],
  { q, region }: ChurchQuery,
): Church[] {
  const needle = squash(q ?? "");

  return churches.filter((church) => {
    if (region && church.region !== region) return false;
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
