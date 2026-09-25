// 마커 이름표 — 탭하지 않아도 어느 교회인지 보이게 한다
//
// **말풍선을 대체한 것이다 (2026-09-21).** 예전에는 마커를 눌러야 교회명이 떴는데,
// 그러면 **지도를 훑는 동안에는 점만 보인다.** 이름표는 늘 떠 있고, 고르는 일은
// 하단 시트가 맡는다(`ChurchListSheet`).
//
// ⚠️ **이름만 담는다.** 지역·화살표까지 넣으면 말풍선만큼 커져서 지도를 덮는다.
// 교회명은 평균 5.3자라 이 크기로 충분하다.
//
// ⚠️ **클러스터러가 이 오버레이를 관리하지 않는다.** 마커는 묶이면 숨지만 이름표는
// 그대로 남으므로, **켜고 끄는 것은 부르는 쪽(`ChurchMap`)이 줌 레벨로 판단한다.**
// 이걸 잊으면 전국 화면에서 묶음 위에 이름표 92개가 통째로 겹쳐 뜬다.

import type { MapPoint } from "./points";

/*
  지도 위에서 글자가 읽히도록 면을 깔고, 선택되면 브랜드 네이비로 뒤집는다.

  ⚠️ **회색 테두리 + 반투명 흰 배경 + 검정 글자로 만들었다가 고쳤다** (2026-09-21).
  지도 위에서 묻혀 보이지 않았고, 이유가 셋이었다.

  | 무엇 | 왜 묻혔나 |
  |---|---|
  | `bg-background/90` | **10% 투명**이라 지도 무늬가 비쳤다 → 불투명하게 |
  | `border-border`(`oklch(0.922 0 0)`) | 흰 배경 위에서 **거의 안 보이는 회색** → 브랜드 네이비로 |
  | `text-foreground`(검정) | **카카오 기본 POI 라벨도 검정**이라 섞였다 → 네이비로 |

  **색을 새로 들이지 않았다** — 네이비 한 가족 안에서 채움과 반전으로만 가른다.

  ⚠️ **채움을 기본에 주고 반전을 선택에 준다 (2026-09-21 결정).** 처음에는 반대였는데
  (기본 흰 알약 · 선택 네이비 채움) **92개가 지도에 묻혔다.** 뒤집은 근거는 둘이 하는
  일이 다르다는 것이다.

  - **기본은 **보이는 것**이 일이다** — 92개가 한눈에 읽혀야 하므로 가장 센 표현(채움)을 준다
  - **선택은 **구분되는 것**이 일이다** — 이미 신호가 둘 더 있다(하단 시트가 그 교회를
    띄우고, 지도가 그 마커로 이동한다). 네이비 밭에서 **흰 알약은 구멍처럼 튄다**

  ⚠️ **선택에 새 색(청록 `--brand-accent`)을 쓰지 않았다** — 이 지도에서 청록은 이미
  **내 위치 점**(`location-dot.ts`)의 색이다. 선택한 교회가 청록이면 "여기가 당신"과
  "고른 교회"가 같은 색이 된다. 사이트 전체로도 청록은 지역 표시·강조에 쓰인다.
*/
const PILL_BASE =
  "inline-block rounded-full border px-2 py-0.5 text-t2 font-semibold whitespace-nowrap shadow-md";
const PILL_IDLE = "border-primary bg-primary text-primary-foreground";
/** 고른 하나. 테두리를 남기고 링을 더해 **"덜 칠해진 것"이 아니라 "골라진 것"으로 읽히게 한다** */
const PILL_SELECTED =
  "border-primary bg-background text-primary ring-2 ring-primary/30";

/**
 * 마커 **위**에 세울 이름표를 만든다.
 *
 * ⚠️ **`pointer-events-none`이다.** 이름표가 조작을 먹으면 **지도를 끌 수 없는 구역이
 * 마커마다 생긴다.** 탭 대상은 마커(29×42)로 둔다 — 이름표는 읽는 것이지 누르는 것이
 * 아니다.
 */
export function createChurchLabel(point: MapPoint): HTMLElement {
  /*
    **아래쪽 여백이 이름표를 마커 위로 밀어 올린다.** `yAnchor: 1`이 이 상자의 아래변을
    좌표에 맞추는데, 카카오 기본 마커는 그 좌표에서 **위로 42px** 서 있다. 여백이
    없으면 이름표가 마커를 덮는다.

    ⚠️ **처음에는 마커 아래에 붙였다가 위로 옮겼다** (2026-09-21). 아래에 두면
    **이름표가 다음 마커의 머리를 가리고**, 무엇보다 지도 관례가 아니다.
  */
  const wrapper = document.createElement("div");
  /*
    ⚠️ **`church-label`은 스타일이 아니라 표식이다.** 카카오가 이 엘리먼트를 자기
    컨테이너로 한 번 더 감싸는데 **그 컨테이너가 `pointer-events: auto`라 마커 클릭을
    가로챈다**(2026-09-21 실측: 마커 중심에서 잡히는 것이 마커가 아니라 그 div였다).
    `globals.css`가 이 클래스를 가진 자식을 둔 부모를 찾아 이벤트를 통과시킨다 —
    **클래스명을 바꾸면 그쪽도 함께 고쳐야 한다.**
  */
  wrapper.className = "church-label pointer-events-none pb-12";

  const pill = document.createElement("span");
  pill.className = `${PILL_BASE} ${PILL_IDLE}`;
  pill.textContent = point.name;

  wrapper.append(pill);
  return wrapper;
}

/** 선택된 교회의 이름표를 뒤집는다. **지도에서 "어느 것을 골랐는지"를 말하는 유일한 표시다** */
export function setLabelSelected(wrapper: HTMLElement, selected: boolean): void {
  const pill = wrapper.firstElementChild;
  if (!pill) return;
  pill.className = `${PILL_BASE} ${selected ? PILL_SELECTED : PILL_IDLE}`;
}
