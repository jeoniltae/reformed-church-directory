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
 *
 * **값이 없는 건은 세지 않는다** — 교단이 없는 건은 어느 묶음에도 잡히지 않고,
 * `subRegion`이 없는 건(세종 2곳)도 마찬가지다. 그래서 **합이 총계와 어긋날 수 있다.**
 * 건수를 주석에 적어 두면 데이터가 바뀔 때 조용히 낡으므로 숫자를 쓰지 않는다.
 */
export function countBy(
  churches: Church[],
  key: "region" | "subRegion" | "denomination" | "denominationGroup",
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

/** 랜딩 상단 분포 줄에 세우는 항목 수 */
const FACET_LIMIT = 3;

export interface FacetItem {
  name: string;
  /** `2곳` — 전부 1곳이라 건수를 생략한 줄에서는 없다 */
  count?: string;
}

export interface FacetLine {
  items: FacetItem[];
  /** `외 3종` — 숨긴 것이 없으면 빈 문자열 */
  rest: string;
}

/**
 * 랜딩 상단의 분포 줄 — `고신·고려 계열 2곳, 합신 계열 1곳, 합동 계열 1곳 외 3종`.
 *
 * **문자열이 아니라 조각으로 돌려준다.** 화면이 이름과 건수를 다르게 칠해야 하는데
 * (`고신·고려 계열`은 `foreground`, `2곳`은 `muted`), 문자열로 넘기면 받는 쪽에서
 * 다시 쪼개야 한다. **한 줄 문자열이 필요하면 아래 `facetText()`를 쓴다.**
 *
 * **위 `facetPhrase`와 쓰는 자리가 다르다.** 그쪽은 문장(JSON-LD description) 안에
 * 들어가는 조각이고, 이쪽은 **라벨과 짝지어 화면에 나가는 줄**이다. 규칙 넷이 다르다.
 *
 * - ⚠️ **`순`을 쓰지 않는다.** 예전 화면 줄은 `… 순`으로 **"뒤 숫자의 합이 총계와
 *   맞지 않는다"**를 신호했는데, 작은 지역에서는 **나열이 곧 전부라 그 신호가 거짓**이
 *   됐고(부산·인천·제주·전남광주·전북), 교단이 하나뿐인 충북에서는 `합신 계열 3곳 순`이
 *   되어 **하나짜리에 순위를 매겼다.** 숨긴 것이 있으면 `외 N종`으로 밝히고 없으면
 *   아무 말도 하지 않는다 — **없는 신호가 잘못된 신호보다 낫다.**
 * - **꼬리가 한 개면 꼬리를 만들지 않는다.** `외 1개`는 그 이름을 적는 것보다 길다.
 * - **전부 1곳이면 건수를 생략한다.** `동래구 1곳, 부산진구 1곳, 사하구 1곳`은
 *   `1곳`을 세 번 쓰고도 분포를 말하지 못한다. 순서도 없으니 이름만 세운다.
 *   건수 내림차순이라 **보이는 것이 전부 1이면 숨은 것도 전부 1이다.**
 * - ⚠️ **항목은 쉼표로 가른다. `·`를 쓰지 않는다** — `고신·고려 계열`처럼 값 안에
 *   이미 `·`가 있어 항목 경계가 무너진다.
 *
 * ⚠️ `unit`**에 `구`·`시`를 쓰지 않는다.** 시군구 접미사가 지역마다 다르다 —
 * 서울·부산·인천은 `구`, 경기·전북·충북·제주는 `시`, 전남광주는 둘이 섞여 있다.
 * 그래서 교단 묶음은 `종`, 지역·시군구는 `개`를 쓴다.
 */
export function facetLine(
  counts: FacetCount[],
  unit: string,
  limit = FACET_LIMIT,
): FacetLine {
  if (counts.length === 0) return { items: [], rest: "" };
  // 숨길 것이 하나뿐이면 그것까지 세운다
  const size = counts.length - limit === 1 ? limit + 1 : limit;
  const head = counts.slice(0, size);
  const namesOnly = head.every(({ count }) => count === 1);
  const hidden = counts.length - head.length;

  return {
    items: head.map(({ value, count }) => ({
      name: value,
      count: namesOnly ? undefined : `${count}곳`,
    })),
    rest: hidden > 0 ? `외 ${hidden}${unit}` : "",
  };
}

/**
 * 위 줄을 문자열 하나로 납작하게 편다.
 *
 * **화면은 조각째 받아 이름과 건수를 다르게 칠한다**(`LandingFacts`) — 이름이
 * `foreground`, 건수·쉼표·`외 N종`이 `muted`다. 그런데 **교단 허브는 라벨 없이 한
 * 줄로 잇는 자리**라 그 구분이 필요 없다. 그래서 규칙은 한곳에 두고 표현만 가른다.
 */
export function facetText({ items, rest }: FacetLine): string {
  const joined = items
    .map(({ name, count }) => (count ? `${name} ${count}` : name))
    .join(", ");
  return rest ? `${joined} ${rest}` : joined;
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
