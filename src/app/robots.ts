// 검색 노출 차단 — 공개 전까지 모든 크롤러를 막는다
//
// ⚠️ **이 파일은 임시다.** `docs/중간점검.md`의 2번(Vercel 연결·프리뷰 확인)은
// 공개가 아니므로 색인을 막아 둔다. 6번(공개)에서 이 파일을 통째로 교체하며,
// 그때 AI 크롤러 allow 정책(`CLAUDE.md`의 "AI 크롤러 정책")과 sitemap 링크가 들어간다.
//
// **여는 것을 잊으면 배포해도 검색에 영원히 안 잡힌다.** 공개 시 반드시 확인할 것.

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
