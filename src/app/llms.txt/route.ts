// /llms.txt — AI 검색·답변 엔진용 사이트 개요 (llmstxt.org 포맷)
//
// **`public/`의 정적 파일이 아니라 라우트로 만든다.** 본문의 수록 건수·지역 목록이
// 전부 데이터에서 나오는 값이라, 정적 파일로 두면 확장하는 순간 거짓말이 된다.
// 본문 생성은 `src/lib/llms-txt.ts`가 하고 여기서는 응답만 만든다.

import { getAllChurches } from "@/features/churches/data";
import { buildLlmsTxt } from "@/lib/llms-txt";

// 빌드 시점에 한 번 구워둔다 — 요청마다 만들 이유가 없다
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(getAllChurches()), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
