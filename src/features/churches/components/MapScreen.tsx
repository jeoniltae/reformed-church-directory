"use client";
// 지도 탭의 화면 구성 — 지도와 하단 시트가 "고른 교회" 하나를 나눠 쓴다
//
// **왜 래퍼가 필요한가** (2026-09-21). 마커를 누르면 시트가 그 교회를 띄우려면 두
// 컴포넌트가 같은 상태를 봐야 하는데, `/map`은 서버 컴포넌트라 상태를 들 수 없다.
// 그래서 둘을 감싸는 클라이언트 컴포넌트를 하나 둔다.
//
// **색인에는 영향이 없다** — 클라이언트 컴포넌트도 서버에서 한 번 그려지므로 교회 92곳의
// 링크가 정적 HTML에 그대로 들어간다(`docs/지도-작업.md`의 "지도 디자인 고도화").
//
// ⚠️ **Zustand를 쓰지 않았다.** 이 상태는 화면 하나 안에서만 쓰이고 다른 화면이 알 필요가
// 없다 — 전역 저장소는 모달·토스트처럼 **화면을 가로지르는 것**에만 쓴다(`CLAUDE.md`).

import { useState } from "react";
import type { Church } from "@/types/church";
import { ChurchListSheet, SHEET_PEEK } from "./ChurchListSheet";
import { ChurchMap } from "./ChurchMap";

export function MapScreen({ churches }: { churches: Church[] }) {
  /** 지도에서 고른 교회. 시트가 이걸 받아 한 곳만 보여준다 */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 손잡이로 펼친 상태. 고른 교회가 있으면 시트 쪽에서 그쪽을 우선한다 */
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*
        ⚠️ **`inset-0`이 아니라 `bottom-14`다 — 접힌 시트 높이만큼 비운다.**
        카카오는 로고와 축척을 **컨테이너 아래 20px쯤**에 그리는데, 지도를 바닥까지
        늘리면 시트가 그 위에 올라앉는다. **약관이 로고·저작권 표기를 가리는 것을
        금지한다.** 시트를 펼치거나 교회를 고르는 동안 가려지는 것은 **사용자가 부른
        판**이라 다른 문제다(2026-09-21 판단).
      */}
      <ChurchMap
        churches={churches}
        interactive
        onSelect={setSelectedId}
        selectedId={selectedId}
        selectionInset={SHEET_PEEK}
        className="absolute inset-x-0 top-0 bottom-14 rounded-none"
      />

      <ChurchListSheet
        churches={churches}
        selectedId={selectedId}
        open={open}
        /*
          손잡이를 누르면 — 고른 교회가 있을 때는 그것을 풀고 목록을 편다.
          **한 번의 탭으로 "고름 → 목록"이 끝나야** 아래 `다른 교회 N곳 보기`와
          같은 뜻이 된다.
        */
        onToggle={() => {
          if (selectedId) {
            setSelectedId(null);
            setOpen(true);
            return;
          }
          setOpen(!open);
        }}
        onShowAll={() => {
          setSelectedId(null);
          setOpen(true);
        }}
      />
    </>
  );
}
