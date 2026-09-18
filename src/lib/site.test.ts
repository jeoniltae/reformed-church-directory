// 사이트 상수 단위 테스트 — 소유확인 태그가 빈 채로 나가는 것을 막는다

import { afterEach, describe, expect, it, vi } from "vitest";
import { OG_CONTENT_TYPE, OG_SIZE } from "./og";
import {
  pageMetadata,
  SEARCH_VERIFICATION,
  siteUrl,
  verificationMetadata,
} from "./site";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** 토큰 상수를 갈아끼운다 — 실제 값이 채워져도 테스트가 흔들리지 않게 한다 */
function withTokens(tokens: Partial<typeof SEARCH_VERIFICATION>) {
  const original = { ...SEARCH_VERIFICATION };
  Object.assign(SEARCH_VERIFICATION, {
    google: "",
    naver: "",
    bing: "",
    ...tokens,
  });
  return () => Object.assign(SEARCH_VERIFICATION, original);
}

describe("verificationMetadata", () => {
  it("토큰이 하나도 없으면 블록 자체를 만들지 않는다", () => {
    const restore = withTokens({});
    expect(verificationMetadata()).toBeUndefined();
    restore();
  });

  it("빈 토큰은 태그로 내보내지 않는다 — 내용 없는 meta는 검증을 실패시킨다", () => {
    const restore = withTokens({ google: "g-token" });
    const data = verificationMetadata();
    expect(data).toEqual({ google: "g-token" });
    expect(data).not.toHaveProperty("other");
    restore();
  });

  it("네이버·Bing은 `other`에 각자의 meta 이름으로 들어간다", () => {
    const restore = withTokens({ naver: "n-token", bing: "b-token" });
    expect(verificationMetadata()).toEqual({
      other: {
        "naver-site-verification": "n-token",
        "msvalidate.01": "b-token",
      },
    });
    restore();
  });

  it("셋이 다 있으면 한 블록에 모인다", () => {
    const restore = withTokens({
      google: "g",
      naver: "n",
      bing: "b",
    });
    expect(verificationMetadata()).toEqual({
      google: "g",
      other: { "naver-site-verification": "n", "msvalidate.01": "b" },
    });
    restore();
  });
});

describe("siteUrl", () => {
  it("NEXT_PUBLIC_SITE_URL이 있으면 그것을 쓴다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.refchurch.kr");
    expect(siteUrl()).toBe("https://www.refchurch.kr");
  });

  it("없으면 Vercel이 주는 주소로 떨어진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "example.vercel.app");
    expect(siteUrl()).toBe("https://example.vercel.app");
  });

  it("끝에 슬래시를 붙이지 않는다 — new URL 조립이 이 전제를 깐다", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.refchurch.kr");
    expect(siteUrl().endsWith("/")).toBe(false);
  });
});

/**
 * ⚠️ **페이지가 `openGraph`를 주지 않으면 루트 값이 그대로 물려온다.** 그 상태에서는
 * 모든 화면이 사이트명·홈 주소로 공유됐다 — 교회 상세는 OG 이미지에 교회명이
 * 찍히는데 제목은 사이트명이라 그림과 글이 어긋났고, `og:url`이 전부 `/`라
 * **어느 교회를 공유해도 같은 대상으로 접혔다.** 빌드도 lint도 통과하는 종류의
 * 결함이라 여기서 고정한다.
 */
describe("pageMetadata", () => {
  const meta = pageMetadata({
    title: "언약교회",
    description: "경기 하남시에 있는 언약교회 정보입니다.",
    path: "/churches/언약교회-하남시",
  });

  it("공유 카드가 사이트명이 아니라 이 화면을 말한다", () => {
    expect(meta.openGraph?.title).toEqual({ absolute: "언약교회" });
    expect(meta.openGraph?.description).toBe(meta.description);
  });

  // `og:site_name`이 이미 사이트명을 말한다 — 접미사가 붙으면 같은 말을 두 번 한다
  it("og:title에는 사이트명 접미사를 붙이지 않는다", () => {
    expect(JSON.stringify(meta.openGraph?.title)).not.toContain("디렉토리");
    // 반면 브라우저 탭은 template을 그대로 받아야 하므로 문자열 그대로 넘긴다
    expect(meta.title).toBe("언약교회");
  });

  it("canonical과 og:url이 같은 값에서 나온다", () => {
    expect(meta.alternates?.canonical).toBe("/churches/언약교회-하남시");
    expect(meta.openGraph?.url).toBe(meta.alternates?.canonical);
  });

  /**
   * ⚠️ **페이지가 `openGraph`를 선언하면 루트에서 물려받던 `images`가 통째로
   * 사라진다.** 이 함수를 처음 넣었을 때 **랜딩·정적 화면 19개의 `og:image`가
   * 실제로 없어졌다.** 공유 카드에서 그림이 빠지는데 빌드도 lint도 통과한다.
   */
  const images = (given: ReturnType<typeof pageMetadata>) => {
    const value = given.openGraph?.images;
    return Array.isArray(value) ? value : [];
  };

  it("기본 OG 이미지를 잃지 않는다", () => {
    expect(images(meta)).toHaveLength(1);
    expect(images(meta)[0]).toMatchObject({ url: "/opengraph-image" });
  });

  // 교회 상세는 자기 세그먼트의 `opengraph-image.tsx`가 그린다 — 덮어쓰면 안 된다
  it("자기 이미지를 가진 화면에는 기본 이미지를 얹지 않는다", () => {
    const own = pageMetadata({
      title: "언약교회",
      description: "…",
      path: "/churches/언약교회-하남시",
      ownImage: true,
    });

    expect(own.openGraph?.images).toBeUndefined();
  });

  // `og.ts`는 `node:fs`를 들고 있어 `site.ts`에서 import하지 않는다. 대신 여기서 묶는다
  it("기본 이미지 규격이 실제 OG 라우트와 같다", () => {
    expect(images(meta)[0]).toMatchObject({
      width: OG_SIZE.width,
      height: OG_SIZE.height,
      type: OG_CONTENT_TYPE,
    });
  });
});
