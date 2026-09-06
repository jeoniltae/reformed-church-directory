// 탭바 소속·방향 단위 테스트
//
// **이 계산이 틀리면 에러 없이 조용히 망가진다** — 전환이 사라지고 탭 활성 표시가
// 죽는다. 실제로 랜딩 12개를 추가한 뒤 그 상태로 배포됐다가 발견했다.

import { describe, expect, it } from "vitest";
import { NAV_BACK, NAV_FORWARD } from "@/components/shared/PageTransition";
import { isCurrentTab, type TabScope, tabDirection } from "./tab-nav";

// BottomTabBar의 TABS와 같은 구성
const HOME: TabScope = { href: "/" };
const SEARCH: TabScope = {
  href: "/churches",
  owns: ["/region", "/denomination"],
};
const MAP: TabScope = { href: "/map" };
const TABS = [HOME, SEARCH, MAP];

const indexOf = (pathname: string) =>
  TABS.findIndex((tab) => isCurrentTab(tab, pathname));

describe("isCurrentTab", () => {
  it("`/`는 완전 일치로만 홈이다 — 접두사로 보면 모든 경로가 홈이 된다", () => {
    expect(isCurrentTab(HOME, "/")).toBe(true);
    expect(isCurrentTab(HOME, "/churches")).toBe(false);
    expect(isCurrentTab(HOME, "/report")).toBe(false);
  });

  it("교회 상세는 `검색` 탭에 속한다", () => {
    expect(isCurrentTab(SEARCH, "/churches/언약교회-강동구")).toBe(true);
  });

  it("지역·교단 랜딩도 `검색` 탭에 속한다 — 비워두면 활성 표시와 전환이 함께 죽는다", () => {
    expect(isCurrentTab(SEARCH, "/region/서울")).toBe(true);
    expect(isCurrentTab(SEARCH, "/denomination/합신")).toBe(true);
  });

  it("정책·제보는 어느 탭에도 속하지 않는다 — 탭이 아니므로 활성 표시가 없어야 맞다", () => {
    for (const path of ["/report", "/privacy"]) {
      expect(TABS.some((tab) => isCurrentTab(tab, path))).toBe(false);
    }
  });
});

describe("tabDirection", () => {
  it("오른쪽 탭은 전진, 왼쪽 탭은 후퇴", () => {
    expect(tabDirection(0, 1)).toBe(NAV_FORWARD);
    expect(tabDirection(2, 0)).toBe(NAV_BACK);
  });

  it("현재 탭을 다시 누르면 방향이 없다", () => {
    expect(tabDirection(1, 1)).toBeUndefined();
  });

  it("탭 밖 화면에서 탭으로 나가면 후퇴다 — 예전에는 전환이 아예 없었다", () => {
    // /report·/privacy는 본문 링크를 타고 forward로 들어온 화면이다
    for (const index of [0, 1, 2]) {
      expect(tabDirection(-1, index)).toBe(NAV_BACK);
    }
  });
});

describe("경로별 최종 동작", () => {
  it("모든 주요 경로에서 탭 이동에 전환이 걸린다", () => {
    const paths = [
      "/",
      "/churches",
      "/churches/언약교회-강동구",
      "/map",
      "/region/서울",
      "/denomination/합신",
      "/report",
      "/privacy",
    ];
    for (const path of paths) {
      const current = indexOf(path);
      // 현재 탭이 아닌 칸은 반드시 방향을 갖는다 = 전환이 걸린다
      const others = [0, 1, 2].filter((i) => i !== current);
      for (const index of others) {
        expect(tabDirection(current, index)).toBeDefined();
      }
    }
  });
});
