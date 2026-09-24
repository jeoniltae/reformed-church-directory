"use client";
// ⚠️ **`"use client"`가 경계를 못 박는다.** 이 모듈은 모듈 스코프에서 store를 만드는데,
// 서버 컴포넌트가 import하면 **서버에서 따로 만들어져 화면과 상태가 갈린다** — 에러도
// 나지 않는다. 이 지시문이 있으면 그 import가 빌드에서 바로 걸린다.
//
// 공통 안내 모달의 상태 — 화면을 가로지르는 UI라 Zustand를 쓴다
//
// **`CLAUDE.md`가 Zustand의 용처를 "모달·토스트"로 못 박아 뒀고 이것이 그 첫 사례다.**
// `MapScreen`이 Zustand를 쓰지 않기로 한 이유("화면 하나 안에서만 쓰이는 상태")와
// 정확히 반대편에 있다 — 안내는 탭바·상세·목록 어디서든 뜬다.
//
// ⚠️ **`showNotice()`를 맨 함수로 내보내는 것이 이 모듈의 핵심이다.** 훅이 필요하면
// 부르는 쪽이 클라이언트 컴포넌트여야 하고 조건부 호출도 막힌다. 함수 하나면
// **이벤트 핸들러 안에서 한 줄**로 끝난다 — 그래야 "공통"이라 부를 수 있다.

import type { LucideIcon } from "lucide-react";
import { create } from "zustand";

export interface Notice {
  /** 한 줄 제목. 모달의 접근성 이름이 된다 */
  title: string;
  /** 본문 한두 문장. **무엇이 없는지/왜인지**를 말한다 */
  description: string;
  /**
   * 표식으로 쓸 아이콘.
   *
   * **누른 것과 같은 아이콘을 넘기면 조작과 결과가 이어진다** — 탭바의 `⋯`를 눌렀는데
   * 시트에도 `⋯`가 있으면 "내가 누른 그것"임이 설명 없이 읽힌다. 기본값은 중립이다.
   */
  icon?: LucideIcon;
  /** 닫는 버튼 글자. 기본 `확인` */
  confirmLabel?: string;
  /**
   * 본문 아래 덧붙이는 한 줄.
   *
   * **이용자가 지금 할 수 있는 일이 실제로 있을 때만 쓴다**(제보 창구 등).
   * 채울 말이 없으면 비운다 — `data/notices.json`의 `contact`를 선택 항목으로 둔 것과
   * 같은 판단이다(`CLAUDE.md`).
   */
  footnote?: string;
}

/**
 * 화면에 보이는 단계.
 *
 * ⚠️ **`closing`이 따로 있어야 한다.** 네이티브 `dialog.close()`는 **즉시** 사라지게
 * 하므로, 내려가는 모습을 보여주려면 애니메이션이 끝날 때까지 열린 채로 두었다가
 * 그때 닫아야 한다.
 *
 * **단계를 컴포넌트가 아니라 여기 두는 이유** — 컴포넌트에 `useState`로 두면
 * `open`이 바뀔 때마다 **effect 안에서 setState**를 해야 하고, 그건
 * `react-hooks/set-state-in-effect`에 걸린다(실제로 걸렸다). 상태의 출처가 하나면
 * 맞출 일도 없다.
 */
export type NoticePhase = "closed" | "open" | "closing";

interface NoticeState {
  notice: Notice | null;
  phase: NoticePhase;
  show: (notice: Notice) => void;
  /** 닫기를 요청한다 — 곧바로 사라지지 않고 **퇴장 애니메이션을 지난다** */
  requestClose: () => void;
  /** 퇴장이 끝났다. `NoticeDialog`의 `animationend`가 부른다 */
  finishClose: () => void;
}

/**
 * ⚠️ **닫을 때 `notice`를 비우지 않는다.** 퇴장 애니메이션이 도는 동안에도 내용이
 * 필요하다 — 비우면 **글자가 먼저 사라진 빈 상자가 내려가는 것**이 보인다.
 * 다음 `show()`가 덮어쓰므로 남겨 두어도 새는 곳이 없다.
 */
export const useNoticeStore = create<NoticeState>((set) => ({
  notice: null,
  phase: "closed",
  show: (notice) => set({ notice, phase: "open" }),
  /*
    **열려 있을 때만 `closing`으로 간다.** 이미 닫혀 있는데 요청이 오면 그대로 둔다 —
    안 그러면 **한 번도 열린 적 없는데 퇴장 애니메이션이 도는** 일이 생긴다.
  */
  requestClose: () =>
    set((state) => (state.phase === "open" ? { phase: "closing" } : state)),
  finishClose: () => set({ phase: "closed" }),
}));

/** 화면 어디서든 안내를 띄운다. **이 한 줄이 이 모듈의 공개 API다** */
export function showNotice(notice: Notice): void {
  useNoticeStore.getState().show(notice);
}
