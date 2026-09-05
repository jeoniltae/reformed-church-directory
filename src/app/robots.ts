// /robots.txt — 크롤러에게 무엇을 긁어도 되는지 알린다
//
// **프로덕션 배포에서만 열린다.** 프리뷰·로컬은 여전히 전면 차단이다(아래 참고).

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * 명시적으로 열어두는 크롤러.
 *
 * **`User-agent: *`가 이미 전부 허용하므로 기능상 중복이다.** 그럼에도 이름을 적는
 * 이유는 이 사이트가 그들을 의도적으로 환영한다는 기록을 남기기 위해서다
 * (2026-06-19 AI 크롤러 결정, 2026-09-04 국내 검색엔진 추가).
 *
 * ⚠️ **robots.txt는 가장 구체적인 그룹 하나만 적용한다.** 나중에 `*`에 `Disallow`를
 * 추가해도 여기 적힌 크롤러들은 그 제한을 물려받지 않는다 — 그때는 이 목록도 함께 고칠 것.
 */
const WELCOMED = [
  // 국내 검색 — "교회 찾기"는 생활·지역 쿼리라 네이버 비중이 크다.
  // 크롤러 허용과 별개로 서치어드바이저 소유확인·사이트맵 제출이 따로 필요하다(6-5)
  "Yeti", // 네이버
  "Daumoa", // 다음
  // AI 검색·답변 — 학습용/검색용을 구분하지 않고 전부 허용한다(최대 노출 우선)
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  /**
   * **프로덕션이 아니면 무조건 막는다.**
   *
   * robots.txt는 배포마다 따로 만들어지므로, 이 분기가 없으면 프리뷰 도메인도 함께
   * 열린다. 프리뷰가 색인되면 같은 내용이 두 주소로 잡혀 **본진이 중복 콘텐츠로
   * 손해를 본다.** `VERCEL_ENV`는 Vercel이 빌드 시점에 넣어주며, 로컬 빌드에서는
   * 값이 없어 차단 쪽으로 떨어진다 — 실수하면 닫히는 방향이라 안전하다.
   */
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...WELCOMED.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
