// /sitemap.xml — 색인 대상 주소 목록
//
// **데이터가 늘어도 손댈 일이 없다.** `churches.json`과 랜딩 규칙에서 경로를 뽑으므로
// 고신 2,118건이 들어와도 이 파일은 그대로다.

import type { MetadataRoute } from "next";
import { getAllChurches } from "@/features/churches/data";
import { indexablePaths } from "@/lib/indexable-paths";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  return indexablePaths(getAllChurches()).map((path) => ({
    // **canonical·JSON-LD와 같은 `new URL()`을 쓴다.** 이 사이트는 경로에 한글이
    // 들어가는데, 표기가 어긋나면 같은 페이지를 가리키는 두 주소가 되어 정본 신호가 갈린다
    url: new URL(path, base).toString(),
    /*
      **`lastModified`를 아직 넣지 않는다.** 교회 상세에는 이제 `Church.updatedAt`이라는
      실제 값이 있지만(2026-11-05), 그 날짜가 안정적으로 도는 것을 본 뒤 별도 작업으로
      넣기로 미뤘다. 파일 mtime은 **git이 보존하지 않아 배포마다 체크아웃 시각으로
      새로 찍히고**, 매 빌드 `new Date()`도 같은 문제다 — 둘 다 "전부 방금 수정됨"이라는
      거짓 신호라 쓰지 않는다.

      **`priority`·`changeFrequency`도 넣지 않는다.** 구글이 무시한다고 공식적으로
      밝힌 값이다.
    */
  }));
}
