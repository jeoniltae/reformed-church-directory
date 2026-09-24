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
  /**
   * 검색에 걸린 교회 id. **검색 중이 아니면 `null`이다.**
   *
   * ⚠️ **목록에서 빼는 것이 아니라 가리는 것이다** — DOM 92개는 그대로 둔다. 빼면
   * 정적 HTML의 글자와 링크가 줄어 **색인을 열려던 근거가 무너진다.**
   */
  matchedIds: Set<string> | null;
}

export function ChurchListSheet({
  churches,
  selectedId,
  open,
  onToggle,
  onShowAll,
  matchedIds,
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
  const searching = matchedIds !== null;

  /**
   * 검색 중 목록에서 **몇 번째로 보이는 교회인지**. `모두 보기` 전에 보여줄 10곳을
   * 고르는 데 쓴다.
   *
   * ⚠️ **원본 순서를 그대로 쓴다** — 가나다순은 `/about`의 "평가하거나 순위를 매기지
   * 않습니다"를 지키는 장치라(`data.ts`), 검색 결과라고 순서를 바꾸지 않는다.
   */
  const orderInResult = useMemo(() => {
    const order = new Map<string, number>();
    let index = 0;
    for (const church of churches) {
      if (matchedIds && !matchedIds.has(church.id)) continue;
      order.set(church.id, index++);
    }
    return order;
  }, [churches, matchedIds]);

  const matchCount = matchedIds ? orderInResult.size : churches.length;

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
        /*
          ⚠️ **`h-14`가 아니라 `min-h-14`다.** 펼쳤을 때 설명 문장이 들어오는데,
          모바일 폭에서 두 줄이 되므로 고정 높이면 글자가 잘린다. 접힘·고름 상태는
          한 줄이라 예전과 같은 56px로 남는다.

          **위 패딩이 아래보다 크다**(`pt-5 pb-3`) — 손잡이 막대가 위쪽 8px 자리에
          떠 있어서, 같은 값을 주면 **막대와 글자가 4px까지 붙는다**(실측).
        */
        className="relative mx-auto flex min-h-14 w-full max-w-2xl shrink-0 items-center justify-between gap-3 rounded-t-2xl px-4 pt-5 pb-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
      >
        {/* 끌어올릴 수 있어 보이게 하는 표시. 장식이라 스크린리더에서 감춘다 */}
        <span
          aria-hidden
          className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-border"
        />
        {/*
          **손잡이 줄이 곧 시트의 제목이다** (2026-09-21). 상태마다 다른 것을 말한다 —
          접힘은 `수록 교회 92곳`, 고름은 `선택한 교회`, 펼침은 설명 문장이다.

          ⚠️ **설명 문장을 목록 위가 아니라 여기에 둔다.** 목록 쪽에 두면 스크롤과 함께
          흘러가고(고정하면 같은 자리를 두 번 쓰게 된다), 무엇보다 **접었다 펴는 조작의
          대상과 그 설명이 떨어져 있었다.**

          ⚠️ **둘 다 DOM에 남긴다**(`hidden`으로만 가린다). 첫 렌더는 접힘 상태라
          **설명 문장이 정적 HTML에서 빠지면 색인 글자가 그만큼 줄어든다.**
        */}
        <span className="mt-1 text-t4 text-muted-foreground">
          {selecting ? (
            "선택한 교회"
          ) : searching ? (
            /* 검색 중에는 펼침·접힘과 무관하게 결과 수를 말한다 — 목록이 좁혀진 이유다 */
            <>
              검색 결과{" "}
              <strong className="font-semibold text-foreground">
                {matchCount}곳
              </strong>
            </>
          ) : (
            <>
              <span hidden={open}>
                수록 교회{" "}
                <strong className="font-semibold text-foreground">
                  {churches.length}곳
                </strong>
              </span>
              <span hidden={!open}>
                수록 교회{" "}
                <strong className="font-semibold text-foreground">
                  {churches.length}곳
                </strong>
                {located < churches.length
                  ? ` 가운데 좌표를 확인한 ${located}곳을 지도에 표시합니다.`
                  : "의 위치를 지도에 표시합니다."}{" "}
                마커를 누르면 그 교회가 여기에 보입니다.
              </span>
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
          좌표 없는 교회 — `CLAUDE.md`가 **"지도에서 빠지므로 목록에는 반드시 보여야
          한다"**고 적어 둔 항목이다. 아래 목록에 이미 들어 있지만, **왜 지도에서
          안 보이는지**는 여기서만 말할 수 있다.
        */}
        {missing.length > 0 && (
          <p hidden={selecting} className="text-t2 text-muted-foreground">
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

        {/* 검색이 빈손일 때 — 목록이 통째로 비어 보이는 것을 그냥 두지 않는다 */}
        {searching && matchCount === 0 && (
          <p className="py-6 text-center text-t4 text-muted-foreground">
            검색 결과가 없어요.
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
                  : !orderInResult.has(church.id) ||
                    (!expanded &&
                      (orderInResult.get(church.id) ?? index) >=
                        INITIAL_VISIBLE)
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
            {/* ⚠️ 검색 중이면 **결과 기준**으로 센다 — 결과가 6곳인데 91곳이라 적으면 거짓말이다 */}
            다른 교회 {matchCount - 1}곳 보기
          </Button>
        ) : (
          !expanded &&
          matchCount > INITIAL_VISIBLE && (
            <Button
              variant="outline"
              size="lg"
              className="mt-3 w-full text-t4"
              onClick={() => setExpanded(true)}
            >
              교회 {matchCount - INITIAL_VISIBLE}곳 모두 보기
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
