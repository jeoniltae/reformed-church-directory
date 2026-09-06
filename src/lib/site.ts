// 사이트 정체성 상수 — layout·manifest·OG 이미지가 같은 값을 보게 하는 단일 출처

import type { Metadata } from "next";

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

/**
 * 검색엔진 소유확인 토큰.
 *
 * **비밀이 아니다.** HTML에 그대로 실리는 공개 값이라 저장소에 두는 것이 맞고,
 * 환경변수로 감쌀 이유가 없다. 발급 절차는 `docs/ui-checklist.md`의 6-5에 있다.
 *
 * **빈 값은 태그를 만들지 않는다** — 내용 없는 `<meta>`를 내보내면 검증이 실패한다.
 */
export const SEARCH_VERIFICATION = {
  /** Google Search Console — `google-site-verification` */
  google: "",
  /** 네이버 서치어드바이저 — `naver-site-verification` */
  naver: "",
  /** Bing Webmaster Tools — `msvalidate.01`. **GSC에서 가져오기를 쓰면 필요 없다** */
  bing: "",
};

/**
 * 위 토큰을 Next의 `metadata.verification` 모양으로 바꾼다.
 * 값이 채워진 것만 넣고, 하나도 없으면 블록 자체를 만들지 않는다.
 */
export function verificationMetadata(): Metadata["verification"] | undefined {
  const { google, naver, bing } = SEARCH_VERIFICATION;

  // 네이버·Bing은 Next에 전용 키가 없어 `other`로 직접 이름을 적는다
  const other: Record<string, string> = {};
  if (naver) other["naver-site-verification"] = naver;
  if (bing) other["msvalidate.01"] = bing;

  const verification: Metadata["verification"] = {};
  if (google) verification.google = google;
  if (Object.keys(other).length) verification.other = other;

  return Object.keys(verification).length ? verification : undefined;
}

/**
 * canonical·OG·JSON-LD의 기준이 되는 절대 주소.
 *
 * **`NEXT_PUBLIC_SITE_URL` 하나만 보면 배포 직후 canonical이 전부
 * `http://localhost:3000/...`으로 나간다** — 89개 페이지가 그렇게 구워지는 것을
 * 클린 빌드로 확인했다. 도메인을 붙이기 전 프리뷰 단계에서도 값이 맞도록
 * Vercel이 빌드 시점에 넣어주는 주소를 중간 폴백으로 둔다.
 *
 * **끝에 슬래시를 붙이지 않는다.** `new URL(path, base)`와 문자열 이어붙이기가
 * 둘 다 이 전제를 깔고 있다.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
