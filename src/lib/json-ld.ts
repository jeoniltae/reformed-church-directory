// 구조화 데이터(JSON-LD) 생성 — 검색엔진이 교회 정보를 장소로 이해하게 한다

import type { Church } from "@/types/church";

/**
 * 교회 상세 페이지용 JSON-LD.
 *
 * **타입은 `Church`다.** schema.org에 `Place > CivicStructure > PlaceOfWorship > Church`로
 * 실재하는 타입이다. `LocalBusiness`는 교회를 사업체로 표기하게 되어 사실과 어긋난다.
 *
 * 없는 값은 키 자체를 넣지 않는다 — 빈 문자열을 넣으면 "값이 있는데 비어 있다"로 읽힌다.
 */
export function churchJsonLd(church: Church) {
  return {
    "@context": "https://schema.org",
    "@type": "Church",
    name: church.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: church.address,
      addressRegion: church.region,
      addressCountry: "KR",
    },
    ...(church.lat != null &&
      church.lng != null && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: church.lat,
          longitude: church.lng,
        },
      }),
    ...(church.phone && { telephone: church.phone }),
    ...(church.homepage && { url: church.homepage }),
  };
}

/**
 * `<script type="application/ld+json">`에 넣을 문자열로 만든다.
 * `<`를 이스케이프하지 않으면 데이터에 `</script>`가 섞였을 때 스크립트가 조기 종료된다.
 */
export function toJsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
