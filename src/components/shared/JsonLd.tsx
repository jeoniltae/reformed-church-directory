// 구조화 데이터를 문서에 심는다 — 데이터를 만드는 쪽은 `src/lib/json-ld.ts`다

import { toJsonLdScript } from "@/lib/json-ld";

/**
 * **`dangerouslySetInnerHTML`이 여기 한 곳에만 있게 하려고 만든 컴포넌트다.**
 * 페이지마다 script 태그를 직접 쓰면 `<` 이스케이프를 빠뜨린 곳이 생기고,
 * 그때 데이터에 `</script>`가 섞이면 문서가 그 자리에서 깨진다.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toJsonLdScript(data) }}
    />
  );
}
