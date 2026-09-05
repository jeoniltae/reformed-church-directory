// sitemap 경로 단위 테스트 — 색인 대상을 실수로 넣거나 빼는 것을 막는다

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { landingGroups, landingRegions } from "@/features/churches/landing";
import type { Church } from "@/types/church";
import { indexablePaths } from "./indexable-paths";

// 이 함수의 관심사가 "실제로 어느 화면을 내놓는가"라서 실데이터로 본다
const churches: Church[] = JSON.parse(
  readFileSync("data/churches.json", "utf8"),
);
const paths = indexablePaths(churches);

describe("indexablePaths", () => {
  it("홈·목록·제보·개인정보 처리방침을 넣는다", () => {
    expect(paths).toEqual(
      expect.arrayContaining(["/", "/churches", "/report", "/privacy"]),
    );
  });

  it("`/map`은 넣지 않는다 — 준비 중 안내라 soft 404 위험이 있다", () => {
    expect(paths).not.toContain("/map");
  });

  it("교회 상세를 전량 넣는다", () => {
    const detail = paths.filter((path) => path.startsWith("/churches/"));
    expect(detail).toHaveLength(churches.length);
  });

  it("랜딩은 임계값을 넘긴 것만 넣는다 — landing.ts와 같은 출처를 본다", () => {
    const regions = paths.filter((path) => path.startsWith("/region/"));
    const groups = paths.filter((path) => path.startsWith("/denomination/"));
    expect(regions).toHaveLength(landingRegions(churches).length);
    expect(groups).toHaveLength(landingGroups().length);
  });

  it("임계값 미만 지역은 빠진다 — 주소로는 열리지만 색인 대상은 아니다", () => {
    const small = new Set(
      churches
        .map((church) => church.region)
        .filter(
          (region) =>
            !landingRegions(churches).includes(region),
        ),
    );
    for (const region of small) {
      expect(paths).not.toContain(`/region/${region}`);
    }
    // 표본이 비면 이 테스트가 아무것도 검증하지 못한다
    expect(small.size).toBeGreaterThan(0);
  });

  it("중복이 없다 — 같은 주소가 두 번 실리면 정본 신호가 갈린다", () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("모두 루트 기준 경로다 — 절대 URL 조립은 sitemap.ts가 한다", () => {
    for (const path of paths) expect(path.startsWith("/")).toBe(true);
  });
});
