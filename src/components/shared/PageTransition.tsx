// 페이지 전환 래퍼 — 탭 이동에 방향 슬라이드를 건다. 애니메이션 정의는 globals.css에 있다

import { ViewTransition } from "react";

/**
 * `<Link transitionTypes>`에 넘길 방향. 탭 순서(홈 0 · 검색 1 · 지도 2) 기준으로
 * 오른쪽으로 가면 FORWARD, 왼쪽으로 가면 BACK이다.
 *
 * **문자열을 직접 쓰지 않는다.** 오타가 나도 에러가 없고 애니메이션만 조용히 죽는다.
 * globals.css의 `.nav-forward`·`.nav-back` 선택자와 짝이다.
 */
export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];

/**
 * **각 page.tsx가 직접 감싼다. 레이아웃에 두면 동작하지 않는다.**
 * `enter`/`exit`는 이 컴포넌트가 마운트·언마운트될 때만 발동하는데,
 * 루트 레이아웃의 래퍼는 라우트가 바뀌어도 살아 있어 둘 다 걸리지 않는다.
 *
 * `default: "none"`은 타입이 없는 이동(첫 로드·브라우저 뒤로가기)에서 전환을 끈다.
 * 방향은 `BottomTabBar`가 `transitionTypes`로 넘긴다.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
