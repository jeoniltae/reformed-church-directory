// 구조화 데이터(JSON-LD) 생성 — 검색엔진이 교회 정보를 장소로 이해하게 한다

import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import type { Church } from "@/types/church";

/**
 * 절대 URL을 만든다.
 *
 * **JSON-LD에는 상대 경로를 쓸 수 없다.** canonical은 `metadataBase`가 알아서
 * 절대화해 주지만 여기는 우리가 직접 만들어야 한다. `new URL`을 거치므로
 * 한글 경로가 canonical과 같은 percent-encoding으로 나온다 — **표기가 어긋나면
 * 같은 페이지를 가리키는 두 주소가 되어 정본 신호가 갈린다.**
 */
function abs(path: string): string {
  return new URL(path, siteUrl()).toString();
}

/** `@graph` 안에서 서로를 가리키는 데 쓰는 고정 식별자 */
function organizationId(): string {
  return `${siteUrl()}/#organization`;
}

function websiteId(): string {
  return `${siteUrl()}/#website`;
}

/**
 * 사이트 전역 신원 — Organization + WebSite.
 *
 * **`@graph`로 묶는다.** 따로 내보내면 두 entity의 관계가 끊겨, 검색엔진이
 * "이 웹사이트를 누가 펴내는가"를 잇지 못한다. `@id`로 서로를 참조하게 한다.
 *
 * **`SearchAction`은 넣지 않는다.** 사이트 내 검색이 클라이언트 전용이라
 * 검색 결과를 가리키는 URL이 없다 — 없는 기능을 있다고 신고하는 셈이 된다.
 */
export function siteJsonLd() {
  const url = `${siteUrl()}/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId(),
        name: SITE_NAME,
        url,
        // 검색 결과에 사이트 로고를 띄우는 근거가 된다. 파비콘과 같은 파일이다
        logo: abs("/icon.png"),
      },
      {
        "@type": "WebSite",
        "@id": websiteId(),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url,
        inLanguage: "ko-KR",
        publisher: { "@id": organizationId() },
      },
    ],
  };
}

export interface Crumb {
  name: string;
  /** 사이트 루트 기준 경로. 절대 URL은 이 함수가 만든다 */
  path: string;
}

/**
 * 이동 경로.
 *
 * **랜딩(6-1)이 생기고 나서야 의미가 생겼다.** 그 전에는 홈과 상세뿐이라
 * 계층이라 부를 것이 없었다. 지금은 `홈 > 교회 찾기 > 서울 > 언약교회`처럼
 * 실제 내부 링크와 같은 모양이 된다.
 */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: abs(path),
    })),
  };
}

/**
 * 지역·교단 랜딩용. 이 페이지가 "교회 목록"이라는 것과 그 목록의 내용을 함께 밝힌다.
 *
 * 개별 교회는 이름과 주소(상세 페이지 URL)만 싣는다 — **교단·좌표 같은 값은
 * 상세 페이지의 `Church`가 이미 말하고 있으므로 여기서 되풀이하지 않는다.**
 */
export function churchCollectionJsonLd({
  name,
  description,
  path,
  churches,
}: {
  name: string;
  description: string;
  path: string;
  churches: Church[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: abs(path),
    inLanguage: "ko-KR",
    isPartOf: { "@id": websiteId() },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: churches.length,
      itemListElement: churches.map((church, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: church.name,
        url: abs(`/churches/${church.id}`),
      })),
    },
  };
}

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
