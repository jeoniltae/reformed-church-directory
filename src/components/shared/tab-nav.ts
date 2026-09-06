// 하단 탭바의 소속 판정과 방향 계산
//
// **컴포넌트에서 빼낸 이유** — 이 계산이 틀리면 화면 전환이 조용히 사라지고 탭 활성
// 표시도 함께 죽는다. 에러가 나지 않아 눈으로 보기 전까지 모른다. 순수 함수로 두고
// 테스트로 고정한다(컴포넌트 테스트는 하지 않는다는 정책은 그대로다).

import { NAV_BACK, NAV_FORWARD } from "@/components/shared/PageTransition";

export interface TabScope {
  href: string;
  /**
   * 이 탭의 갈래로 볼 경로 접두사.
   *
   * **지역·교단 랜딩은 결국 교회 목록이라 `검색` 탭에 속한다.** 이걸 비워두면
   * 랜딩에서 탭바에 아무 활성 표시가 없고(어디 있는지 알 수 없다) 전환도 사라진다.
   */
  owns?: readonly string[];
}

/** `/`는 완전 일치로만 판정한다. 접두사로 보면 모든 경로가 홈이 된다 */
export function isCurrentTab(tab: TabScope, pathname: string): boolean {
  if (tab.href === "/") return pathname === "/";
  if (pathname.startsWith(tab.href)) return true;
  return (tab.owns ?? []).some((prefix) => pathname.startsWith(prefix));
}

/**
 * 탭 순서(홈 0 · 검색 1 · 지도 2)를 좌우 방향으로 읽는다.
 *
 * **`currentIndex === -1`은 탭 밖 화면이다** (`/report`·`/privacy`). 어느 탭에도
 * 속하지 않지만 **본문 링크를 타고 forward로 들어온 곳**이므로, 탭으로 나가는 것은
 * 되돌아가는 이동이다. 예전에는 여기서 방향을 아예 붙이지 않아 전환이 없었다.
 */
export function tabDirection(
  currentIndex: number,
  index: number,
  // `readonly`로 돌려주면 `<Link transitionTypes>`가 받지 못한다 (가변 배열을 요구한다)
): string[] | undefined {
  if (index === currentIndex) return undefined; // 현재 탭을 다시 누른 경우
  if (currentIndex === -1) return NAV_BACK;
  return index > currentIndex ? NAV_FORWARD : NAV_BACK;
}
