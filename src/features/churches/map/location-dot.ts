// 내 위치 점 — 지도에서 "여기가 당신"을 가리키는 하나뿐인 표시
//
// ⚠️ **교회 이름표와 색이 달라야 한다.** 이름표는 브랜드 네이비 채움이라, 같은 색을 쓰면
// **내 위치가 교회 하나처럼 읽힌다.** 청록(`--brand-accent`)은 이 사이트에 이미 있는
// 강조색이고 네이비와 확실히 갈린다 — **새 색을 들이지 않으면서 다른 종류임을 말한다.**
//
// **흰 테두리를 두르는 것이 핵심이다.** 지도는 배경색이 제각각이라(도로 흰색, 녹지 연두,
// 물 파랑) 점 하나만 찍으면 어딘가에서는 반드시 묻힌다.

/** 마커·이름표와 달리 **이것은 누를 것이 아니다** — 이벤트를 먹지 않는다 */
export function createLocationDot(): HTMLElement {
  const dot = document.createElement("span");
  dot.className =
    "pointer-events-none block size-3.5 rounded-full border-2 border-background bg-brand-accent shadow-md";
  return dot;
}
