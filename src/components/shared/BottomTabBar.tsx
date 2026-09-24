"use client";
// 하단 탭바 — 홈·검색·지도 세 칸 + 더보기. 현재 경로를 알아야 해서 클라이언트에서 돈다

import { Ellipsis, House, Map as MapIcon, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { showNotice } from "@/components/shared/notice";
import { isCurrentTab, tabDirection } from "@/components/shared/tab-nav";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "홈", icon: House },
  // 지역·교단 랜딩은 교회 목록이므로 `검색`의 갈래로 본다 (`tab-nav.ts` 참고)
  {
    href: "/churches",
    label: "검색",
    icon: Search,
    owns: ["/region", "/denomination"],
  },
  { href: "/map", label: "지도", icon: MapIcon },
] as const;

/**
 * 칸 하나의 생김새.
 *
 * **상수로 뺀 이유는 링크 셋과 버튼 하나가 같아 보여야 하기 때문이다.** 한쪽에만
 * 여백을 고치면 **네 칸 중 하나만 미묘하게 어긋나는데, 그건 눈으로 잡기 어렵다.**
 *
 * `w-full`은 버튼 때문에 필요하다 — `<a>`는 `display:flex`로 칸을 꽉 채우지만
 * **버튼은 내용만큼만 넓어져 가운데 정렬이 깨진다.**
 */
const TAB_ITEM =
  "flex w-full flex-col items-center gap-1 py-2 text-t2 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:bg-muted";

export function BottomTabBar() {
  const pathname = usePathname();
  // 판정과 방향 계산은 `tab-nav.ts`에 있다 — 틀리면 조용히 전환이 사라지는 자리라 테스트로 고정했다
  const currentIndex = TABS.findIndex((tab) => isCurrentTab(tab, pathname));

  return (
    <nav
      aria-label="주요 메뉴"
      // vt-tab-bar는 화면 전환 시 탭바를 스냅샷에서 분리해 고정한다 (globals.css).
      // 이 클래스를 지우면 탭바가 내용과 함께 화면 밖으로 밀린다
      className="vt-tab-bar fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background"
    >
      <ul className="mx-auto flex w-full max-w-2xl">
        {TABS.map((tab, index) => {
          const { href, label, icon: Icon } = tab;
          const active = isCurrentTab(tab, pathname);
          const direction = tabDirection(currentIndex, index);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                transitionTypes={direction}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // 탭바에는 hover조차 없었다. 탭 이동도 카드 탭과 같은 대기가 걸리는데
                  // 그동안 눌렀다는 표시가 전혀 없어, 같은 탭을 두 번 누르게 된다
                  TAB_ITEM,
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}

        {/*
          더보기 — **경로가 없는 유일한 칸이다.**

          ⚠️ **`TABS` 배열에 넣지 않았다.** 넣으면 `isCurrentTab`·`tabDirection`이
          "경로 없는 항목"을 따로 다뤄야 하는데, **그 둘은 틀려도 에러가 나지 않고
          전환과 활성 표시만 조용히 죽는 자리다**(`tab-nav.ts` 머리말). 링크가 아닌
          것을 링크 표에 섞지 않는 편이 싸다.

          **뒤에 붙이므로 앞 세 칸의 인덱스가 그대로다** — 방향 계산도 `tab-nav.test.ts`도
          손댈 것이 없다. ⚠️ **중간에 끼워 넣으면 그 순간 둘 다 틀어진다.**

          **칸이 셋에서 넷이 되어 폭이 33%에서 25%로 준다.** 375px에서 한 칸이 약
          94px이라 글자 세 자와 아이콘이 들어가는 데 무리가 없다.
        */}
        <li className="flex-1">
          <button
            type="button"
            // 누르면 뜨는 것이 모달이라는 것을 보조기기에 알린다
            aria-haspopup="dialog"
            onClick={() =>
              showNotice({
                icon: Ellipsis,
                title: "준비 중입니다",
                description:
                  "더보기에 담을 기능을 아직 만들고 있어요. 준비되는 대로 이 자리에서 열립니다.",
                footnote: "지금은 홈·검색·지도에서 교회를 찾을 수 있어요.",
              })
            }
            className={cn(TAB_ITEM, "text-muted-foreground")}
          >
            {/* 모달의 표식과 같은 아이콘이다 — 누른 것과 뜬 것이 이어진다 */}
            <Ellipsis aria-hidden className="size-5" />
            더보기
          </button>
        </li>
      </ul>
    </nav>
  );
}
