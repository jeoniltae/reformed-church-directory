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
  it("정적 화면을 전부 넣는다", () => {
    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/about",
        "/churches",
        "/denomination",
        "/map",
        "/report",
        "/privacy",
      ]),
    );
  });

  /*
    **허브를 따로 한 번 더 고정하는 이유가 다른 경로와 다르다.** 아래 "랜딩은 임계값을
    넘긴 것만" 테스트는 `/denomination/`(끝 슬래시)로 세기 때문에 **허브를 세지 않는다**
    — 허브가 통째로 빠져도 그 테스트는 초록이다.

    그런데 `landingGroups()`는 랜딩이 있는 묶음만 내놓으므로 `기타` 묶음의 총회명
    (`계신`·`한국개혁장로교회` 등)은 **허브 말고는 sitemap의 어느 경로에도 실리지
    않는다.** 빠지면 그 교단들이 색인 대상에서 조용히 사라진다.
  */
  it("교단 허브를 넣는다 — `기타` 묶음이 실리는 유일한 경로다", () => {
    expect(paths).toContain("/denomination");
  });

  /*
    **이 테스트는 2026-09-24에 뒤집혔다.** 예전에는 `/map`을 **넣지 않는 것**을
    고정하고 있었다("준비 중 안내라 soft 404 위험"). 지도·검색·목록 시트가 붙어
    정적 HTML에 교회 92곳의 이름과 링크가 들어오며 그 근거가 사라졌다.

    ⚠️ **이 파일이 `docs/지도-작업.md` 8단계 목록에 없던 다섯 번째 지점이었다** —
    그 목록은 `map/page.tsx`·`indexable-paths.ts`·`CLAUDE.md` 셋만 적어 뒀고,
    **여기를 빠뜨린 것을 테스트가 빨간불로 잡아 줬다.** 결정을 고정한 테스트는
    결정을 뒤집을 때 함께 뒤집는다.
  */
  it("`/map`을 넣는다 — `robots`의 `index: false`를 푼 것과 짝이다", () => {
    expect(paths).toContain("/map");
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
