// 사이트 상수 단위 테스트 — 소유확인 태그가 빈 채로 나가는 것을 막는다

import { afterEach, describe, expect, it, vi } from "vitest";
import { SEARCH_VERIFICATION, siteUrl, verificationMetadata } from "./site";

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
