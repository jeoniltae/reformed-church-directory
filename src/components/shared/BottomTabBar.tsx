"use client";
// 하단 탭바 — 홈·검색·지도 세 칸. 현재 경로를 알아야 해서 클라이언트에서 돈다

import { House, Map as MapIcon, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "홈", icon: House },
  { href: "/churches", label: "검색", icon: Search },
  { href: "/map", label: "지도", icon: MapIcon },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      // vt-tab-bar는 화면 전환 시 탭바를 스냅샷에서 분리해 고정한다 (globals.css).
      // 이 클래스를 지우면 탭바가 내용과 함께 화면 밖으로 밀린다
      className="vt-tab-bar fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background"
    >
      <ul className="mx-auto flex w-full max-w-2xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          // `/`는 완전 일치로만 판정한다. 접두사로 보면 모든 경로가 홈이 된다
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
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
