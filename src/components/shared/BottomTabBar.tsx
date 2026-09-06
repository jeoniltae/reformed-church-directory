"use client";
// 하단 탭바 — 홈·검색·지도 세 칸. 현재 경로를 알아야 해서 클라이언트에서 돈다

import { House, Map as MapIcon, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
                  "flex flex-col items-center gap-1 py-2 text-t2 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
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
      </ul>
    </nav>
  );
}
