// 지역·교단 랜딩 페이지의 공용 규칙 — 순수 함수라 서버·클라이언트 양쪽에서 쓴다
//
// **왜 랜딩 페이지가 필요한가.** `/churches`의 칩 필터는 클릭으로만 동작해 고유 URL이
// 없다. 크롤러는 버튼을 누르지 않으므로 "서울 교회 30곳"이라는 화면은 검색엔진에
// 존재하지 않는 것과 같다. 지역·교단마다 주소가 붙은 페이지를 따로 구워 그 수요를 받는다.

import type { Church } from "@/types/church";

/**
 * 미리 굽고 sitemap에 넣을 최소 건수.
 *
 * **1~2곳짜리 페이지를 색인에 올리지 않기 위한 값이다.** 내용이 빈약한 페이지가 많으면
 * 사이트 전체 평가가 깎인다. 다만 임계값 미만 지역도 주소로 접근하면 정상 렌더된다
 * (`dynamicParams` 기본값). 미리 굽지 않고 sitemap에 넣지 않을 뿐이라,
 * **건수가 줄어 임계값 아래로 내려가도 이미 색인된 주소가 404가 되지 않는다.**
 */
export const LANDING_MIN = 3;

/**
 * 랜딩을 만들 교단 묶음과 그 URL slug.
 *
 * **`기타`는 일부러 뺐다.** 16건이 모여 있지만 "기타 교단 교회"를 검색하는 사람은 없다.
 * 묶음 이름의 `·`와 공백은 주소에서 지운다 — `고신·고려 계열` → `/denomination/고신고려`.
 *
 * **새 묶음이 생기면 여기 추가해야 랜딩이 만들어진다.** `landing.test.ts`가
 * 실데이터와 이 표를 대조해 누락을 잡는다.
 */
const LANDING_GROUPS = [
  { group: "합신 계열", slug: "합신" },
  { group: "합동 계열", slug: "합동" },
  { group: "고신·고려 계열", slug: "고신고려" },
  { group: "대신 계열", slug: "대신" },
  { group: "독립·해외", slug: "독립해외" },
] as const;

/** 랜딩을 만들지 않는 묶음. 이유는 `LANDING_GROUPS` 주석에 있다 */
export const EXCLUDED_GROUP = "기타";

export interface LandingGroup {
  group: string;
  slug: string;
}

/** 랜딩 대상 교단 묶음 전체 */
export function landingGroups(): LandingGroup[] {
  return [...LANDING_GROUPS];
}

/** slug로 교단 묶음 이름을 찾는다. 표에 없으면 undefined */
export function groupFromSlug(slug: string): string | undefined {
  return LANDING_GROUPS.find((g) => g.slug === slug)?.group;
}

/** 교단 묶음 이름으로 slug를 찾는다. 랜딩을 만들지 않는 묶음이면 undefined */
export function slugFromGroup(group: string): string | undefined {
  return LANDING_GROUPS.find((g) => g.group === group)?.slug;
}

export interface FacetCount {
  value: string;
  count: number;
}

/**
 * 한 필드 기준으로 세어 건수 내림차순으로 돌려준다.
 * **값이 없는 건은 세지 않는다** — 교단이 없는 6건은 어느 묶음에도 잡히지 않는다.
 */
export function countBy(
  churches: Church[],
  key: "region" | "denominationGroup",
): FacetCount[] {
  const counts = new Map<string, number>();
  for (const church of churches) {
    const value = church[key];
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([value, count]) => ({ value, count }));
}

/** 미리 구울 지역 목록 — 건수가 `LANDING_MIN` 이상인 것만, 많은 순 */
export function landingRegions(churches: Church[]): string[] {
  return countBy(churches, "region")
    .filter(({ count }) => count >= LANDING_MIN)
    .map(({ value }) => value);
}

/**
 * 이 지역에 랜딩 페이지를 링크해도 되는지.
 *
 * **임계값 미만 지역으로는 링크하지 않는다.** 주소로 접근하면 렌더되긴 하지만,
 * 링크를 걸면 크롤러가 그 얇은 페이지까지 따라가 임계값을 둔 의미가 없어진다.
 */
export function hasRegionLanding(churches: Church[], region: string): boolean {
  return churches.filter((church) => church.region === region).length >= LANDING_MIN;
}

/** `합신 계열 8곳, 고신·고려 계열 7곳` 꼴로 잇는다 */
export function facetPhrase(counts: FacetCount[], limit = 3): string {
  return counts
    .slice(0, limit)
    .map(({ value, count }) => `${value} ${count}곳`)
    .join(", ");
}

/**
 * 지역 랜딩의 안내 문장.
 *
 * **목록만 있으면 얇다.** 교단 구성을 문장으로 덧붙여 이 페이지가 무엇을 모아둔
 * 곳인지 사람과 검색엔진 양쪽에 설명한다. 값은 전부 데이터에서 계산한다.
 */
export function regionSummary(region: string, churches: Church[]): string {
  const head = `${region}에 있는 개혁주의 교회 ${churches.length}곳입니다.`;
  const groups = countBy(churches, "denominationGroup");

  if (groups.length === 0) return head;
  if (groups.length === 1) {
    return `${head} 교단은 ${groups[0].value} ${groups[0].count}곳입니다.`;
  }
  return `${head} 교단별로는 ${facetPhrase(groups)} 순입니다.`;
}

/** 교단 랜딩의 안내 문장. 지역 랜딩과 반대로 지역 분포를 보여준다 */
export function groupSummary(group: string, churches: Church[]): string {
  const head = `${group} 교회 ${churches.length}곳입니다.`;
  const regions = countBy(churches, "region");

  if (regions.length === 0) return head;
  if (regions.length === 1) {
    return `${head} 모두 ${regions[0].value}에 있습니다.`;
  }
  return `${head} 지역별로는 ${facetPhrase(regions)} 순입니다.`;
}
