// sitemap에 실을 경로 목록 — 어느 화면을 검색에 내놓을지 한곳에서 정한다

import { landingGroups, landingRegions } from "@/features/churches/landing";
import type { Church } from "@/types/church";

/**
 * 색인 대상 정적 경로.
 *
 * **`/map`이 빠져 있다 (2026-09-04 결정).** "준비 중" 안내만 있는 화면이라 검색
 * 노출 가치가 없고, 내용 없는 페이지는 soft 404로 판정될 위험이 있다. 실제 지도가
 * 붙는 7단계에서 이 결정을 뒤집는다 — 그때 `/map`의 `robots: { index: false }`도 함께 푼다.
 *
 * `/report`·`/privacy`는 넣는다. 검색 유입 가치는 낮지만 색인돼도 무해하고,
 * **삭제 요청 창구가 검색으로 발견되는 편이 낫다.**
 */
const STATIC_PATHS = ["/", "/churches", "/report", "/privacy"];

/**
 * sitemap에 실을 경로 전부.
 *
 * **랜딩은 `landing.ts`의 함수를 그대로 쓴다.** sitemap과 `generateStaticParams`가
 * 같은 출처를 보게 되어, 임계값 규칙이 한쪽에만 반영되는 일이 생기지 않는다.
 * 임계값 미만 지역은 여기에 없다 — 주소로는 열리지만 색인 대상은 아니다.
 */
export function indexablePaths(churches: Church[]): string[] {
  return [
    ...STATIC_PATHS,
    ...landingRegions(churches).map((region) => `/region/${region}`),
    ...landingGroups().map(({ slug }) => `/denomination/${slug}`),
    ...churches.map((church) => `/churches/${church.id}`),
  ];
}
