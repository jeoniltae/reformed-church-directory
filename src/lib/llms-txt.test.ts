// llms.txt 본문 단위 테스트 — 사실과 어긋난 문장이 나가는 것을 막는다

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { landingGroups, landingRegions } from "@/features/churches/landing";
import type { Church } from "@/types/church";
import { buildLlmsTxt } from "./llms-txt";

const SITE = "https://www.refchurch.kr";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
});
afterEach(() => {
  vi.unstubAllEnvs();
});

// 이 문서의 관심사가 "실제로 무엇을 담고 있다고 말하는가"라서 실데이터로 본다
const churches: Church[] = JSON.parse(
  readFileSync("data/churches.json", "utf8"),
);

describe("buildLlmsTxt", () => {
  it("llmstxt.org 골격을 갖춘다 — H1과 요약 인용문", () => {
    const text = buildLlmsTxt(churches);
    expect(text.startsWith("# 개혁주의 교회 디렉토리")).toBe(true);
    expect(text).toMatch(/\n> /);
  });

  it("수록 건수가 실데이터와 일치한다", () => {
    expect(buildLlmsTxt(churches)).toContain(`교회 ${churches.length}곳을`);
  });

  it("개별 교회 URL을 나열하지 않는다 — 그건 sitemap의 역할이다", () => {
    // 89개(확장 후 수천 개)를 여기 늘어놓으면 llms.txt가 sitemap 흉내를 내게 된다
    expect(buildLlmsTxt(churches)).not.toContain("/churches/");
  });

  it("지역·교단 랜딩은 landing.ts와 같은 목록을 쓴다", () => {
    const text = buildLlmsTxt(churches);
    for (const region of landingRegions(churches)) {
      expect(text).toContain(`${SITE}/region/${encodeURIComponent(region)}`);
    }
    for (const { slug } of landingGroups()) {
      expect(text).toContain(`${SITE}/denomination/${encodeURIComponent(slug)}`);
    }
  });

  it("임계값 미만 지역은 링크하지 않는다 — 색인 대상과 같은 기준이다", () => {
    const text = buildLlmsTxt(churches);
    const listed = new Set(landingRegions(churches));
    const small = [...new Set(churches.map((c) => c.region))].filter(
      (region) => !listed.has(region),
    );
    for (const region of small) {
      expect(text).not.toContain(`/region/${encodeURIComponent(region)}`);
    }
    expect(small.length).toBeGreaterThan(0);
  });

  it("예배시간이 없다는 사실을 밝힌다 — AI가 없는 값을 안내하면 안 된다", () => {
    // 데이터에 실제로 하나도 없을 때만 이 문장이 참이다
    expect(churches.some((c) => c.worshipTimes?.length)).toBe(false);
    expect(buildLlmsTxt(churches)).toContain("예배시간을 안내하지 마세요");
  });

  it("인용 조건과 삭제 요청 승계를 밝힌다 — AI가 데이터를 가져가는 주체다", () => {
    const text = buildLlmsTxt(churches);
    expect(text).toContain("비영리");
    expect(text).toContain("삭제 요청은 복제본에도 따라가야 합니다");
    // 조건 전문으로 갈 길이 있어야 한다
    expect(text).toContain("data/LICENSE.md");
  });

  it("모든 링크가 절대 URL이다", () => {
    const urls = [...buildLlmsTxt(churches).matchAll(/\]\(([^)]+)\)/g)].map(
      (m) => m[1],
    );
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url.startsWith(`${SITE}/`)).toBe(true);
  });

  it("수록 범위의 한계를 밝힌다 — 없는 교회를 부정하지 않도록", () => {
    expect(buildLlmsTxt(churches)).toContain(
      "여기 없는 교회가 개혁주의가 아니라는 뜻도 아닙니다",
    );
  });
});
