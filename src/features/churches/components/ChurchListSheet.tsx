"use client";
// 지도 아래에서 올라오는 교회 목록 시트 — 전체화면 지도에서 글자와 목록을 담는 유일한 자리
//
// **왜 시트인가** (2026-09-20). `/map`을 전체화면 지도로 바꾸면서 목록을 걷어냈더니
// 이 화면의 정적 HTML이 **91자**로 줄었다(`/churches`는 4,430자). 그 상태로 색인을 열면
// 내용 없는 페이지로 취급될 위험이 있어 **8단계 색인 계획이 통째로 흔들렸다.**
//
// 시트는 그 둘을 동시에 푼다 — **페이지 세로 스크롤은 여전히 0이고**(스크롤은 이 안에서만
// 일어난다), 목록이 DOM으로 돌아와 글자와 링크가 복구된다.
//
// **고른 교회를 보여주는 자리이기도 하다** (2026-09-21). 지도에서 마커를 누르면
// 말풍선 대신 이 시트가 그 교회를 띄운다 — 말풍선보다 담기는 정보가 많고, 화면에
// 이미 있는 것을 다시 쓰는 것이라 새 UI가 늘지 않는다.
//
// ⚠️ **접는 것이지 잘라내는 것이 아니다.** `slice()`로 10개만 렌더하면 나머지가 정적
// HTML에서 통째로 빠져 **색인을 열려던 이유가 사라진다.** `/churches`가 같은 이유로
// `hidden`을 쓴다 — 그쪽 주석과 짝이다. **고른 교회만 보이게 할 때도 같은 방식이다.**

import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DataNotice } from "@/components/shared/DataNotice";
import { NAV_BACK, NAV_FORWARD } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";
import { hasCoords } from "../map/points";
import { ChurchRow } from "./ChurchRow";

/**
 * 교회를 골랐을 때 올라오는 높이(px). **아래 `h-52`와 같은 값이어야 한다**(13rem).
 *
 * 지도는 이만큼 위로 밀려 **고른 마커가 시트 뒤에 숨지 않는다**(`ChurchMap`의
 * `selectionInset`). ⚠️ **한쪽만 고치면 마커가 시트에 가린다.**
 */
export const SHEET_PEEK = 208;

/**
 * 펼치기 전에 보이는 교회 수.
 *
 * **`/churches`의 20보다 작다.** 그쪽은 화면 전체를 쓰지만 여기는 시트가 화면의 60%라
 * 20개는 어차피 한 번에 보이지 않는다. 10개면 **"더 있다"가 보이는 만큼**은 된다.
 */
const INITIAL_VISIBLE = 10;

/** 안내 줄에 이름을 적을 최대 교회 수 — 고신 2,118건 확장 때 문단이 되지 않게 */
const NAMED_LIMIT = 3;

interface ChurchListSheetProps {
  churches: Church[];
  /** 지도에서 고른 교회. 있으면 **그 한 곳만 보여주는 모드**가 된다 */
  selectedId: string | null;
  /** 손잡이로 펼친 상태. 고른 교회가 있으면 그쪽이 우선한다 */
  open: boolean;
  onToggle: () => void;
  /** `다른 교회 N곳 보기` — 고른 것을 풀고 평소 목록으로 돌아간다 */
  onShowAll: () => void;
}

export function ChurchListSheet({
  churches,
  selectedId,
  open,
  onToggle,
  onShowAll,
}: ChurchListSheetProps) {
  /** 한 번 펼치면 접기로 되돌리지 않는다 — `/churches`와 같은 판단이다 */
  const [expanded, setExpanded] = useState(false);

  const located = useMemo(() => churches.filter(hasCoords).length, [churches]);
  const missing = useMemo(
    () => churches.filter((church) => !hasCoords(church)),
    [churches],
  );
  const named = missing.slice(0, NAMED_LIMIT);

  /** 고른 교회가 있으면 그 모드가 손잡이 상태를 이긴다 */
  const selecting = Boolean(selectedId);
  const shown = selecting || open;

  return (
    <section
      aria-label="수록 교회 목록"
      className={cn(
        // ⚠️ `overflow-hidden`이 없으면 **접었을 때 내용이 아래로 넘쳐 탭바 위에 비친다**
        "absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-lg transition-[height] duration-300",
        // 접힘(손잡이 한 줄) · 고름(한 곳 + 버튼) · 펼침(화면의 60%) 세 단이다
        selecting ? "h-52" : open ? "h-3/5" : "h-14",
      )}
    >
      <button
        type="button"
        aria-expanded={shown}
        onClick={onToggle}
        // 폭은 사이트 공통(`max-w-2xl`)에 맞춘다 — 데스크톱에서 행이 화면 끝까지 늘어지면
        // 교회명과 교단 배지가 멀어져 한 줄로 읽히지 않는다
        className="relative mx-auto flex h-14 w-full max-w-2xl shrink-0 items-center justify-between rounded-t-2xl px-4 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
      >
        {/* 끌어올릴 수 있어 보이게 하는 표시. 장식이라 스크린리더에서 감춘다 */}
        <span
          aria-hidden
          className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-border"
        />
        {/*
          ⚠️ **`수록 교회 N곳`은 접혔을 때만 쓴다.** 펼치면 바로 아래 설명 문장이
          `수록 교회 92곳의 위치를…`으로 같은 말을 반복해 **한 화면에 같은 숫자가 두 번**
          나온다. 접힌 상태에서는 그 문장이 안 보이므로 여기가 유일한 안내다.

          **빈 채로라도 남겨 둔다** — `justify-between`의 왼쪽 칸이라 지우면 오른쪽
          화살표가 왼쪽으로 끌려간다.
        */}
        <span className="mt-1 text-t4 text-muted-foreground">
          {selecting
            ? "선택한 교회"
            : !open && (
                <>
                  수록 교회{" "}
                  <strong className="font-semibold text-foreground">
                    {churches.length}곳
                  </strong>
                </>
              )}
        </span>
        <ChevronUp
          aria-hidden
          className={cn(
            "mt-1 size-4 text-muted-foreground transition-transform",
            open && !selecting && "rotate-180",
          )}
        />
      </button>

      {/*
        ⚠️ **닫혀 있을 때 `inert`다.** 내용은 DOM에 그대로 남아야 하지만(색인) **보이지 않는
        링크에 탭 초점이 들어가면 안 된다.** `hidden`으로 지우면 목적이 무너지고,
        아무것도 안 하면 스크린리더가 접힌 목록 92개를 읽는다.

        **스크롤은 여기서만 일어난다** — 페이지는 끝까지 스크롤이 없다.
      */}
      <div
        inert={!shown}
        className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-4"
      >
        {/*
          ⚠️ **좌표가 전부 있으면 "가운데 N곳"을 말하지 않는다** — 같은 숫자를 두 번
          읽히는 꼴이 된다(2026-09-20에 군산진성교회가 빠지며 실제로 그렇게 됐다).
          **조건을 지우지 않는다** — 확장하면 좌표 없는 교회가 다시 생긴다.

          고른 교회가 있을 때는 감춘다 — 그 화면에서는 한 곳만 말해야 한다.
        */}
        {/*
          **스크롤해도 맨 위에 붙어 있는 타이틀 줄이다** (2026-09-21).

          예전에는 목록과 함께 흘러가 버려서, 몇 줄만 내려도 **이 시트가 무엇인지 말하는
          문장이 사라졌다.** 손잡이 줄 바로 아래에 고정해 두면 그 역할을 계속한다.

          ⚠️ **`bg-background`와 `-mx-4`가 함께 있어야 한다.** 배경이 없으면 교회 행이
          글자 뒤로 비쳐 지나가고, 음수 여백이 없으면 **좌우 16px 패딩 자리로 행이
          삐져나와 보인다.**
        */}
        <p
          hidden={selecting}
          className="sticky top-0 z-10 -mx-4 border-b border-border bg-background px-4 pb-2 text-t4 text-muted-foreground"
        >
          수록 교회{" "}
          <strong className="font-semibold text-foreground">
            {churches.length}곳
          </strong>
          {located < churches.length
            ? ` 가운데 좌표를 확인한 ${located}곳을 지도에 표시합니다.`
            : "의 위치를 지도에 표시합니다."}{" "}
          마커를 누르면 그 교회가 여기 뜹니다.
        </p>

        {/*
          좌표 없는 교회 — `CLAUDE.md`가 **"지도에서 빠지므로 목록에는 반드시 보여야
          한다"**고 적어 둔 항목이다. 아래 목록에 이미 들어 있지만, **왜 지도에서
          안 보이는지**는 여기서만 말할 수 있다.
        */}
        {missing.length > 0 && (
          <p hidden={selecting} className="mt-3 text-t2 text-muted-foreground">
            좌표를 확인하지 못해 지도에 표시되지 않는 교회 {missing.length}곳 —{" "}
            {named.map((church, index) => (
              <span key={church.id}>
                {index > 0 && ", "}
                <Link
                  href={`/churches/${church.id}`}
                  transitionTypes={NAV_FORWARD}
                  className="rounded-lg text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {church.name}
                </Link>
              </span>
            ))}
            {missing.length > named.length &&
              ` 외 ${missing.length - named.length}곳`}
            . 아래 목록에는 그대로 있습니다.
          </p>
        )}

        {/*
          홈 미리보기와 같은 행 어휘다 — `/churches`의 카드를 복제하지 않는다.

          ⚠️ **고른 교회만 보일 때도 순서를 바꾸지 않는다.** 고른 것을 맨 위로 끌어올리면
          가나다순이 깨지는데, 그 순서는 `/about`의 **"평가하거나 순위를 매기지 않습니다"**를
          지키는 장치다(`data.ts` 주석). 접었다 펴는 방식이면 순서를 건드릴 이유가 없다.
        */}
        <ul className="mt-1 divide-y divide-border">
          {churches.map((church, index) => (
            <li
              key={church.id}
              hidden={
                selecting
                  ? church.id !== selectedId
                  : !expanded && index >= INITIAL_VISIBLE
              }
            >
              <ChurchRow church={church} />
            </li>
          ))}
        </ul>

        {selecting ? (
          /*
            고른 것을 풀고 평소 목록으로 돌아간다. **선택을 유지한 채 목록만 펴지 않는다** —
            그러면 접기 단계가 셋(고름 / 10개 / 전체)이 되어 사용자가 어디에 있는지 흐려진다.
          */
          <Button
            variant="outline"
            size="lg"
            className="mt-3 w-full text-t4"
            onClick={onShowAll}
          >
            다른 교회 {churches.length - 1}곳 보기
          </Button>
        ) : (
          !expanded &&
          churches.length > INITIAL_VISIBLE && (
            <Button
              variant="outline"
              size="lg"
              className="mt-3 w-full text-t4"
              onClick={() => setExpanded(true)}
            >
              교회 {churches.length - INITIAL_VISIBLE}곳 모두 보기
            </Button>
          )
        )}

        {/* 지도(2) → 검색(1)이라 왼쪽으로 되돌아간다 */}
        <div hidden={selecting} className="mt-4 text-center">
          <Link
            href="/churches"
            transitionTypes={NAV_BACK}
            className="rounded-lg text-t4 text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            검색·필터로 찾기
          </Link>
        </div>

        {/*
          **푸터를 여기서 되살린다.** 전체화면으로 바꾸며 `DataNotice`가 빠졌는데,
          그러면 이 화면에 **삭제 요청 창구와 개인정보 처리방침으로 가는 길이 없다.**
          시트가 생겨 다시 담을 자리가 났다.
        */}
        <div hidden={selecting}>
          <DataNotice />
        </div>
      </div>
    </section>
  );
}
