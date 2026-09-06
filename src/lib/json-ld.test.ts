// 구조화 데이터 단위 테스트 — 실제 보유 데이터의 표기를 본떠 최소 표본을 만든다

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Church } from "@/types/church";
import {
  breadcrumbJsonLd,
  churchCollectionJsonLd,
  churchJsonLd,
  siteJsonLd,
  toJsonLdScript,
} from "./json-ld";

const SITE = "https://www.refchurch.kr";

// siteUrl()이 환경변수를 보므로 고정한다. 안 그러면 실행 환경에 따라 결과가 달라진다
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const withCoords: Church = {
  id: "언약교회-강동구",
  name: "언약교회",
  region: "서울",
  subRegion: "강동구",
  address: "서울 강동구 강일동 69",
  pastor: "이승구",
  denomination: "합신",
  denominationGroup: "합신 계열",
  phone: "070-4101-3578",
  homepage: "http://www.covenantchurch.kr/",
  lat: 37.5721,
  lng: 127.1766,
  source: "자체 수집",
};

// 좌표·전화·홈페이지가 없는 건을 대표한다 (좌표는 21건이 비어 있다)
const bare: Church = {
  id: "서울진명교회-관악구",
  name: "서울진명교회",
  region: "서울",
  subRegion: "관악구",
  address: "서울특별시 관악구 봉천로 553 (봉천동)",
  pastor: "리종연",
  source: "자체 수집",
};

// **`describe` 본문이 아니라 테스트 안에서 부른다.** 본문은 `beforeEach`보다 먼저
// 돌아서 환경변수 스텁이 아직 걸리지 않은 채로 URL이 만들어진다
describe("siteJsonLd", () => {
  it("Organization과 WebSite를 한 그래프에 담는다", () => {
    expect(siteJsonLd()["@graph"].map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
    ]);
  });

  it("WebSite가 Organization을 @id로 가리킨다 — 끊기면 발행 주체를 잇지 못한다", () => {
    const [org, site] = siteJsonLd()["@graph"];
    expect(site).toMatchObject({ publisher: { "@id": org["@id"] } });
    expect(org["@id"]).toBe(`${SITE}/#organization`);
  });

  it("로고는 파비콘과 같은 파일을 절대 URL로 가리킨다", () => {
    expect(siteJsonLd()["@graph"][0]).toMatchObject({
      logo: `${SITE}/icon.png`,
    });
  });

  it("SearchAction을 넣지 않는다 — 사이트 내 검색에 URL이 없다", () => {
    expect(JSON.stringify(siteJsonLd())).not.toContain("SearchAction");
  });
});

describe("breadcrumbJsonLd", () => {
  it("position은 1부터 매기고 경로는 절대 URL로 바꾼다", () => {
    expect(
      breadcrumbJsonLd([
        { name: "홈", path: "/" },
        { name: "교회 찾기", path: "/churches" },
      ]).itemListElement,
    ).toEqual([
      { "@type": "ListItem", position: 1, name: "홈", item: `${SITE}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "교회 찾기",
        item: `${SITE}/churches`,
      },
    ]);
  });

  it("한글 경로는 canonical과 같은 percent-encoding으로 나간다", () => {
    const [crumb] = breadcrumbJsonLd([
      { name: "서울", path: "/region/서울" },
    ]).itemListElement;
    // 표기가 canonical과 어긋나면 같은 페이지를 가리키는 두 주소가 된다
    expect(crumb.item).toBe(`${SITE}/region/%EC%84%9C%EC%9A%B8`);
  });
});

describe("churchCollectionJsonLd", () => {
  const build = () =>
    churchCollectionJsonLd({
      name: "서울 개혁주의 교회",
      description: "서울에 있는 개혁주의 교회 2곳입니다.",
      path: "/region/서울",
      churches: [withCoords, bare],
    });

  it("목록 건수와 항목 수가 일치한다", () => {
    const data = build();
    expect(data.mainEntity.numberOfItems).toBe(2);
    expect(data.mainEntity.itemListElement).toHaveLength(2);
  });

  it("각 항목은 상세 페이지를 절대 URL로 가리킨다", () => {
    expect(build().mainEntity.itemListElement[0]).toMatchObject({
      position: 1,
      name: "언약교회",
      url: `${SITE}/churches/%EC%96%B8%EC%95%BD%EA%B5%90%ED%9A%8C-%EA%B0%95%EB%8F%99%EA%B5%AC`,
    });
  });

  it("WebSite에 속한 페이지임을 밝힌다", () => {
    expect(build().isPartOf).toEqual({ "@id": `${SITE}/#website` });
  });
});

describe("churchJsonLd", () => {
  it("교회별 OG 이미지를 image로 넣는다 — 리치 결과의 유일한 경고였다", () => {
    expect(churchJsonLd(withCoords).image).toBe(
      `${SITE}/churches/%EC%96%B8%EC%95%BD%EA%B5%90%ED%9A%8C-%EA%B0%95%EB%8F%99%EA%B5%AC/opengraph-image`,
    );
  });

  it("image 경로에 빌드마다 바뀌는 해시를 붙이지 않는다", () => {
    expect(churchJsonLd(bare).image).not.toContain("?");
  });

  it("좌표가 있으면 geo를 넣는다", () => {
    expect(churchJsonLd(withCoords)).toMatchObject({
      "@type": "Church",
      geo: { "@type": "GeoCoordinates", latitude: 37.5721, longitude: 127.1766 },
      telephone: "070-4101-3578",
    });
  });

  it("없는 값은 키 자체를 넣지 않는다 — 빈 문자열은 `있는데 비었다`로 읽힌다", () => {
    const data = churchJsonLd(bare);
    expect(data).not.toHaveProperty("geo");
    expect(data).not.toHaveProperty("telephone");
    expect(data).not.toHaveProperty("url");
  });

  it("교회를 사업체로 표기하지 않는다", () => {
    expect(JSON.stringify(churchJsonLd(withCoords))).not.toContain(
      "LocalBusiness",
    );
  });
});

describe("toJsonLdScript", () => {
  it("`<`를 이스케이프한다 — 안 하면 </script>가 섞였을 때 문서가 깨진다", () => {
    const out = toJsonLdScript({ name: "</script><b>x</b>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
  });

  it("이스케이프해도 JSON으로 되읽힌다", () => {
    const value = "a<b";
    expect(JSON.parse(toJsonLdScript({ value })).value).toBe(value);
  });
});
