// sitemap에 실을 경로 목록 — 어느 화면을 검색에 내놓을지 한곳에서 정한다

import { landingGroups, landingRegions } from "@/features/churches/landing";
import type { Church } from "@/types/church";

/**
 * 색인 대상 정적 경로.
 *
 * **`/map`을 넣었다 (2026-09-24, `docs/지도-작업.md` 8단계).** 2026-09-04에는 빠져
 * 있었다 — "준비 중" 안내만 있는 화면이라 **내용 없는 페이지가 soft 404로 판정될
 * 위험**이 근거였다. 지도·검색·목록 시트가 붙으며 **정적 HTML에 교회 92곳의 이름과
 * 링크**가 들어왔고 그 근거가 사라졌다.
 *
 * ⚠️ **`src/app/map/page.tsx`의 `robots` 속성과 짝이다.** 한쪽만 고치면 **sitemap에는
 * 있는데 `noindex`인**(또는 그 반대인) 모순이 남는다.
 *
 * `/report`·`/privacy`는 넣는다. 검색 유입 가치는 낮지만 색인돼도 무해하고,
 * **삭제 요청 창구가 검색으로 발견되는 편이 낫다.**
 *
 * **`/about`은 오히려 색인 가치가 높다 (2026-09-12).** 누가 만들었고 무엇을
 * 근거로 모았는지를 밝히는 화면이라, 검색엔진이 이 사이트를 평가할 때 쓰는
 * 신뢰 신호가 된다. `개혁주의란`·`용어 정리`처럼 **교회명이 아닌 검색어로 들어올
 * 통로**이기도 하다 — 다른 정적 화면에는 없는 성격이다.
 *
 * **`/denomination` 허브는 이유가 또 있다 (2026-09-18).** 아래 `landingGroups()`는
 * 랜딩이 있는 묶음만 내놓으므로 `기타` 묶음의 총회명(`계신`·`한국개혁장로교회` 등)은
 * sitemap의 어느 경로에도 실리지 않는다. **허브가 그 묶음을 글자로 담은 유일한
 * 화면이다** — 빼면 그 교단들이 색인 대상에서 통째로 사라진다.
 */
const STATIC_PATHS = [
  "/",
  "/about",
  "/churches",
  "/denomination",
  "/map",
  "/report",
  "/privacy",
];

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
