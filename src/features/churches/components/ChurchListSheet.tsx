"use client";
// 지도 위로 올라오는 교회 목록 시트 — 전체화면 지도에서 글자와 목록을 담는 유일한 자리
//
// **왜 시트인가** (2026-09-20). `/map`을 전체화면 지도로 바꾸면서 목록을 걷어냈더니
// 이 화면의 정적 HTML이 **91자**로 줄었다(`/churches`는 4,430자). 그 상태로 색인을 열면
// 내용 없는 페이지로 취급될 위험이 있어 **8단계 색인 계획이 통째로 흔들렸다.**
//
// 시트는 그 둘을 동시에 푼다 — **페이지 세로 스크롤은 여전히 0이고**(스크롤은 이 안에서만
// 일어난다), 목록이 DOM으로 돌아와 글자와 링크가 복구된다.
//
// ⚠️ **접는 것이지 잘라내는 것이 아니다.** `slice()`로 10개만 렌더하면 나머지가 정적
// HTML에서 통째로 빠져 **색인을 열려던 이유가 사라진다.** `/churches`가 같은 이유로
// `hidden`을 쓴다 — 그쪽 주석과 짝이다.

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
 * 펼치기 전에 보이는 교회 수.
 *
 * **`/churches`의 20보다 작다.** 그쪽은 화면 전체를 쓰지만 여기는 시트가 화면의 60%라
 * 20개는 어차피 한 번에 보이지 않는다. 10개면 **"더 있다"가 보이는 만큼**은 된다.
 */
const INITIAL_VISIBLE = 10;

/** 안내 줄에 이름을 적을 최대 교회 수 — 고신 2,118건 확장 때 문단이 되지 않게 */
const NAMED_LIMIT = 3;

export function ChurchListSheet({ churches }: { churches: Church[] }) {
  const [open, setOpen] = useState(false);
  /** 한 번 펼치면 접기로 되돌리지 않는다 — `/churches`와 같은 판단이다 */
  const [expanded, setExpanded] = useState(false);

  const located = useMemo(
    () => churches.filter(hasCoords).length,
    [churches],
  );
  const missing = useMemo(
    () => churches.filter((church) => !hasCoords(church)),
    [churches],
  );
  const named = missing.slice(0, NAMED_LIMIT);

  return (
    <section
      aria-label="수록 교회 목록"
      className={cn(
        // ⚠️ `overflow-hidden`이 없으면 **접었을 때 내용이 아래로 넘쳐 탭바 위에 비친다**
        "absolute inset-x-0 bottom-0 flex flex-col overflow-hidden rounded-t-2xl border-t border-border bg-background shadow-lg transition-[height] duration-300",
        // 접었을 때 높이는 손잡이 줄 하나다. 지도는 이 위에서 끝난다(`page.tsx`의 `bottom-14`)
        open ? "h-3/5" : "h-14",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        // 폭은 사이트 공통(`max-w-2xl`)에 맞춘다 — 데스크톱에서 행이 화면 끝까지 늘어지면
        // 교회명과 교단 배지가 멀어져 한 줄로 읽히지 않는다
        className="relative mx-auto flex h-14 w-full max-w-2xl shrink-0 items-center justify-between rounded-t-2xl px-4 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
      >
        {/* 끌어올릴 수 있어 보이게 하는 표시. 장식이라 스크린리더에서 감춘다 */}
        <span
          aria-hidden
          className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-border"
        />
        <span className="mt-1 text-t4 text-muted-foreground">
          수록 교회{" "}
          <strong className="font-semibold text-foreground">
            {churches.length}곳
          </strong>
        </span>
        <ChevronUp
          aria-hidden
          className={cn(
            "mt-1 size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/*
        ⚠️ **접었을 때 `inert`다.** 내용은 DOM에 그대로 남아야 하지만(색인) **보이지 않는
        링크에 탭 초점이 들어가면 안 된다.** `hidden`으로 지우면 목적이 무너지고,
        아무것도 안 하면 스크린리더가 접힌 목록 91개를 읽는다.

        **스크롤은 여기서만 일어난다** — 페이지는 끝까지 스크롤이 없다.
      */}
      <div
        inert={!open}
        className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-4"
      >
        {/*
          ⚠️ **좌표가 전부 있으면 "가운데 N곳"을 말하지 않는다** — 같은 숫자를 두 번
          읽히는 꼴이 된다(2026-09-20에 군산진성교회가 빠지며 실제로 그렇게 됐다).
          **조건을 지우지 않는다** — 확장하면 좌표 없는 교회가 다시 생긴다.
        */}
        <p className="text-t4 text-muted-foreground">
          수록 교회{" "}
          <strong className="font-semibold text-foreground">
            {churches.length}곳
          </strong>
          {located < churches.length
            ? ` 가운데 좌표를 확인한 ${located}곳을 지도에 표시합니다.`
            : "의 위치를 지도에 표시합니다."}{" "}
          마커나 아래 목록에서 교회를 고르면 상세 화면으로 이동합니다.
        </p>

        {/*
          좌표 없는 교회 — `CLAUDE.md`가 **"지도에서 빠지므로 목록에는 반드시 보여야
          한다"**고 적어 둔 항목이다. 아래 목록에 이미 들어 있지만, **왜 지도에서
          안 보이는지**는 여기서만 말할 수 있다.
        */}
        {missing.length > 0 && (
          <p className="mt-2 text-t2 text-muted-foreground">
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

        {/* 홈 미리보기와 같은 행 어휘다 — `/churches`의 카드를 복제하지 않는다 */}
        <ul className="mt-1 divide-y divide-border">
          {churches.map((church, index) => (
            <li
              key={church.id}
              hidden={!expanded && index >= INITIAL_VISIBLE}
            >
              <ChurchRow church={church} />
            </li>
          ))}
        </ul>

        {!expanded && churches.length > INITIAL_VISIBLE && (
          <Button
            variant="outline"
            size="lg"
            className="mt-3 w-full text-t4"
            onClick={() => setExpanded(true)}
          >
            교회 {churches.length - INITIAL_VISIBLE}곳 모두 보기
          </Button>
        )}

        {/* 지도(2) → 검색(1)이라 왼쪽으로 되돌아간다 */}
        <div className="mt-4 text-center">
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
        <DataNotice />
      </div>
    </section>
  );
}
