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

import { Loader2, LocateFixed } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";
import {
  type LocateError,
  LOCATE_MESSAGE,
  LOCATE_OPTIONS,
  locateErrorKind,
} from "../map/locate";
import { FLOATING_PANEL } from "../map/panel";
import { ChurchListSheet, SHEET_PEEK } from "./ChurchListSheet";
import { ChurchMap } from "./ChurchMap";

export function MapScreen({ churches }: { churches: Church[] }) {
  /** 지도에서 고른 교회. 시트가 이걸 받아 한 곳만 보여준다 */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 손잡이로 펼친 상태. 고른 교회가 있으면 시트 쪽에서 그쪽을 우선한다 */
  const [open, setOpen] = useState(false);

  /** 브라우저가 알려준 내 위치. `at`은 같은 자리에서 버튼을 다시 눌러도 반응하게 한다 */
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
    at: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<LocateError | null>(null);

  /*
    내 위치를 묻는다. **좌표는 지도 중심을 옮기는 데만 쓰고 어디로도 보내지 않는다**
    (`/privacy`에 명시) — 애초에 이 사이트에는 받을 서버가 없다.

    ⚠️ **`navigator.geolocation`이 있는지부터 보지 않는다.** 보안 컨텍스트가 아니면
    객체는 있는데 호출이 거절되고, 그 이유가 `PERMISSION_DENIED`로 와서 **권한 문제로
    오인된다.** 판정은 `locateErrorKind`가 한다(`locate.ts` 주석).
  */
  const locate = () => {
    setLocateError(null);

    const secure = window.isSecureContext;
    if (!secure || !navigator.geolocation) {
      setLocateError(locateErrorKind(secure));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        setMyLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          at: Date.now(),
        });
      },
      (error) => {
        setLocating(false);
        setLocateError(locateErrorKind(secure, error.code));
      },
      LOCATE_OPTIONS,
    );
  };

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
        myLocation={myLocation}
        selectionInset={SHEET_PEEK}
        className="absolute inset-x-0 top-0 bottom-14 rounded-none"
      />

      {/*
        내 위치 버튼 — **오른쪽 아래, 접힌 시트 바로 위다.**

        ⚠️ **왼쪽 아래를 쓰지 않는다** — 카카오 로고와 축척이 그 자리에 있고, **약관이
        가리는 것을 금지한다.**

        **시트가 올라오면 감춘다.** 그 위로 겹치면 반쯤 가려진 버튼이 되고, 지도를 거의
        못 보는 상태에서 위치를 옮길 이유도 없다.
      */}
      {!open && !selectedId && (
        <div className="pointer-events-none absolute right-3 bottom-20 flex flex-col items-end gap-2">
          {locateError && (
            /* 안내지 경고가 아니다 — 붉은색을 쓰지 않는다(`ChurchNotice`와 같은 판단) */
            <p
              role="status"
              className={cn(
                FLOATING_PANEL,
                "pointer-events-auto max-w-56 px-3 py-2 text-t2 text-muted-foreground",
              )}
            >
              {LOCATE_MESSAGE[locateError]}
            </p>
          )}

          <button
            type="button"
            onClick={locate}
            aria-label="내 위치로 이동"
            aria-busy={locating}
            className={cn(
              FLOATING_PANEL,
              "pointer-events-auto grid size-11 place-items-center text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:bg-muted",
              // 지도 위의 원형 버튼이라 모서리를 완전히 둥글린다
              "rounded-full",
            )}
          >
            {locating ? (
              <Loader2 aria-hidden className="size-5 animate-spin" />
            ) : (
              <LocateFixed aria-hidden className="size-5" />
            )}
          </button>
        </div>
      )}

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
