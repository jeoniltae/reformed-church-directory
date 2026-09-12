"use client";
// 맨 위로 — 긴 목록에서 검색창·필터까지 되돌아가는 거리를 줄인다
//
// **문서가 긴 화면에 붙인다** — 교회 목록이 있는 화면(홈·`/churches`·지역/교단 랜딩)과
// `/about`이다. 상세·제보·처리방침은 짧아서 붙이지 않는다.
//
// (2026-09-12) 예전에는 **"교회 목록이 있는 화면에만"**이라고 적혀 있었고 읽는 화면은
// "스크롤이 길지 않다"는 것이 근거였다. `/about`이 약 4800px으로 **목록 화면들보다
// 길어지면서 그 전제가 깨졌다.** 기준을 화면 종류가 아니라 길이로 고쳐 적는다.
//
// **짧은 화면에서는 스스로 나타나지 않는다.** 임계값이 800px이라, 문서 전체가
// 화면 높이 + 800px보다 짧으면 `scrollY`가 그 값에 닿지 못한다. 홈처럼 2화면쯤
// 되는 곳에서는 버튼이 뜨지 않고, 나중에 내용이 길어지면 저절로 나타난다.
// **화면마다 켜고 끄는 조건을 따로 두지 않는 이유가 이것이다.**

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

/** 이 높이를 넘겨 내려가면 버튼이 나온다 */
const THRESHOLD = 800;

export function ScrollToTop() {
  // 서버에는 스크롤 위치가 없다. 초기값을 false로 두어 하이드레이션이 어긋나지 않는다
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!scrolled) return null;

  return (
    <button
      type="button"
      aria-label="맨 위로"
      onClick={() =>
        window.scrollTo({
          top: 0,
          // 화면 전환·지역 롤링에 이미 적용한 기준을 여기서도 지킨다
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      // 탭바(64px) 위로 띄운다. 44px이라 아이콘 하나뿐이어도 손가락 기준을 채운다
      className="fixed right-4 bottom-20 grid size-11 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ArrowUp aria-hidden className="size-5" />
    </button>
  );
}
