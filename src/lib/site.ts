// 사이트 정체성 상수 — layout·manifest·OG 이미지가 같은 값을 보게 하는 단일 출처

export const SITE_NAME = "개혁주의 교회 디렉토리";

export const SITE_DESCRIPTION =
  "국내 개혁주의 교단 교회를 교회명·지역·교단·담임목사 기준으로 찾아보세요.";

/**
 * 브랜드 네이비. `globals.css`의 `--primary`(`oklch(0.35 0.09 250)`)와 같은 색이다.
 *
 * **CSS 토큰을 두고 굳이 hex를 또 두는 이유** — OG 이미지(Satori)와 웹 매니페스트는
 * `oklch()`를 해석하지 못한다. 그 둘에서만 이 값을 쓴다. **색을 바꾸면 두 곳을 함께
 * 고쳐야 한다** — 화면은 토큰을 따라가지만 OG 이미지와 매니페스트는 여기를 따라간다.
 */
export const BRAND_NAVY = "#0b3c67";
