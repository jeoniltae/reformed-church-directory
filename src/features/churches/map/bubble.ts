// 마커 말풍선 — 지도에서 고른 교회를 확인하고 상세로 들어가는 한 단계
//
// **바로 이동하지 않고 말풍선을 한 번 거친다** (2026-09-19 결정). 마커는 손끝보다
// 작고 수도권에서는 서로 붙어 있어 **오탭이 잦다.** 바로 이동하면 엉뚱한 교회 상세로
// 가고 되돌아오려면 뒤로가기를 눌러야 한다. 말풍선은 **누가 선택됐는지 보여주고**,
// 빗나간 탭은 이동 없이 끝난다.
//
// ⚠️ **React가 아니라 DOM을 직접 만든다.** 카카오 `CustomOverlay`가 요구하는 것이
// 엘리먼트라서다 — 여기만 예외이고 다른 화면에서 이 방식을 따라 하지 않는다.

import type { MapPoint } from "./points";

/**
 * 말풍선 하나를 만든다. 누르면 `onSelect`가 불린다.
 *
 * **진짜 `<a>`다.** 이동은 `onSelect`(라우터)가 하지만, 링크로 두면 **길게 눌러 주소
 * 복사**나 **새 탭으로 열기**가 그대로 동작한다. 그래서 보조키가 눌린 클릭은
 * 가로채지 않고 브라우저에 넘긴다.
 *
 * ⚠️ **`tabindex="-1"`을 준다.** 지도 컨테이너가 `aria-hidden`이라(`ChurchMap`),
 * 초점이 닿는 링크를 그 안에 두면 **보조기기에는 감춰져 있는데 탭으로는 닿는**
 * 상태가 된다. 지도는 보조 수단이고 **목록이 정본 경로**라는 결정의 연장이다.
 */
export function createChurchBubble(
  point: MapPoint,
  onSelect: () => void,
): HTMLElement {
  /*
    아래 여백(`pb-12`)이 말풍선을 마커 위로 밀어 올린다 — `yAnchor: 1`이 이 상자의
    아래변을 좌표에 맞추므로, 여백이 없으면 말풍선이 마커를 덮는다.
    **여백은 클릭을 먹지 않게 `pointer-events-none`으로 비운다** — 그러지 않으면
    마커 주변의 빈 지도를 눌러도 말풍선이 닫히지 않는다.
  */
  const wrapper = document.createElement("div");
  wrapper.className = "relative pb-12";

  const link = document.createElement("a");
  link.href = `/churches/${point.id}`;
  link.tabIndex = -1;
  link.className =
    "pointer-events-auto flex max-w-56 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left shadow-md active:translate-y-px";

  const text = document.createElement("span");
  text.className = "min-w-0 flex-1";

  const name = document.createElement("span");
  name.className = "block truncate text-t4 font-semibold text-foreground";
  name.textContent = point.name;

  const place = document.createElement("span");
  place.className = "mt-0.5 block truncate text-t2 text-muted-foreground";
  place.textContent = point.place;

  const chevron = document.createElement("span");
  chevron.setAttribute("aria-hidden", "true");
  chevron.className = "shrink-0 text-t4 text-muted-foreground";
  chevron.textContent = "›";

  // 말풍선 꼬리. 회전한 정사각형의 두 변만 남겨 아래를 가리키게 한다
  const tail = document.createElement("div");
  tail.className =
    "absolute bottom-11 left-1/2 size-2.5 -translate-x-1/2 rotate-45 border-r border-b border-border bg-background";

  text.append(name, place);
  link.append(text, chevron);
  wrapper.append(link, tail);

  link.addEventListener("click", (event) => {
    // 새 탭으로 열기·주소 복사는 브라우저에 맡긴다
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    onSelect();
  });

  return wrapper;
}
