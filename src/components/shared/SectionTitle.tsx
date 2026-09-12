"use client";
// 절 제목 — 화면 위에 닿으면 고정되고, 고정된 동안 러닝 헤드로 바뀐다
//
// `/about`이 4800px짜리 문서라 **지금 몇 번째 절을 읽고 있는지가 화면에서 사라진다.**
// 제목이 상단에 남아 있으면 그 표시가 유지된다.
//
// **왜 클라이언트 컴포넌트인가.** "지금 붙어 있는가"는 CSS만으로 알 수 없다 —
// `:stuck` 선택자는 아직 어느 브라우저에도 없다. 스크롤 기반 애니메이션
// (`animation-timeline`)으로도 안 된다: `contain` 구간은 **뷰포트보다 긴 절에만
// 생겨서**, 여섯 절 중 02·04만 걸리고 나머지는 붙어도 아무 일이 없다.
//
// ⚠️ **제목 자체를 보지 않고 센티넬을 둔다.** 고정된 제목은 언제나 화면 안에 있어서,
// 제목의 위치만으로는 "붙어서 위에 있는 것"과 "그냥 위쪽에 보이는 것"이 구분되지
// 않는다. 바로 위 센티넬은 고정되지 않으므로 **화면 위로 넘어갔는가** 하나로 끝난다.
//
// ⚠️ **IntersectionObserver를 쓰다가 스크롤 리스너로 바꿨다.** IO는 교차 상태가
// 바뀔 때만 콜백을 부르는데, **화면 아래에서 화면 위로 한 번에 건너뛰면 "교차 중"인
// 순간이 없어 콜백이 아예 뜨지 않는다.** 연속 스크롤에서는 멀쩡하고 점프에서만
// 깨지므로 놓치기 쉽다(실측으로 잡았다). 점프는 실제로 일어난다 — 새로고침 시
// 스크롤 복원, 그리고 **같은 화면의 `ScrollToTop`이 `prefers-reduced-motion`에서
// 즉시 점프한다.** 그 경우 절 제목들이 맨 위에서도 강조된 채 남는다.
// `ScrollToTop`과 같은 방식(스크롤 리스너 + `passive`)으로 통일했다.
//
// ## 고정 상태의 표시 (2026-09-12 개편)
//
// 처음에는 배경을 `bg-background`로 바꾸고 회색 1px 선을 다는 것이 전부였는데,
// **흰 배경 사이트라 "흰색으로 칠하기"는 눈에 보이는 변화가 0이었다.** 게다가 해제
// 상태에는 오른쪽으로 뻗는 룰이 있어서 **고정 상태가 해제 상태보다 덜 꾸며져 있었다.**
//
// - **떠 있다는 신호는 그림자가 맡는다.** 면으로는 분리할 수 없다(배경도 흰색이다).
//   그림자가 없으면 본문이 아래로 지나갈 때 선에서 잘려 사라지는 것처럼 보인다.
// - **번호가 청록 채움 칩이 된다.** 강조가 실제로 보이는 유일한 지점이다.
//   `--primary`가 아니라 `--brand-accent`라 "화면당 brand-solid 하나"(06)와 무관하다.
// - **하단 룰은 진행 게이지다.** 회색 트랙 위로 청록이 절을 읽은 만큼 찬다.
//   구동은 `globals.css`의 `.section-progress` — JS가 아니라 스크롤 타임라인이다.
//
// ⚠️ **높이가 변하면 안 된다.** 고정된 요소도 흐름에서 자리를 차지하므로 크기나
// 여백이 바뀌면 그만큼 아래 내용이 밀린다. 그래서 **`h-12`로 높이를 못 박고** 안에서
// 색만 바꾼다. 번호 칩의 좌우 여백도 두 상태에 똑같이 있어야 제목 글자가 옆으로
// 밀리지 않는다 — 배경색만 투명↔청록으로 간다.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  /** 절 번호. 장식이라 `aria-hidden`이다 — 스크린리더가 "공일"을 읽을 이유가 없다 */
  no: string;
  children: string;
}

export function SectionTitle({ no, children }: SectionTitleProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  // 서버에는 스크롤 위치가 없다. `false`로 시작해야 하이드레이션이 어긋나지 않는다
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;

    // 센티넬이 화면 **위로** 넘어갔으면 제목이 붙어 있는 상태다
    const sync = () => setStuck(el.getBoundingClientRect().top < 0);
    // 새로고침 시 브라우저가 스크롤 위치를 복원하므로 첫 값을 직접 읽어야 한다
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <>
      {/* `-mb-px`가 1px을 되돌려 레이아웃에는 영향이 없다 */}
      <div ref={sentinel} aria-hidden className="h-px -mb-px" />
      <h2
        className={cn(
          // **`-mx-4 px-4`로 `main`의 좌우 여백을 덮는다.** 없으면 고정된 띠 양옆
          // 16px으로 아래 글자가 그대로 비쳐 지나간다.
          "sticky top-0 z-10 -mx-4 flex h-12 items-center gap-2 px-4 text-t7 font-bold text-foreground transition-shadow",
          stuck ? "bg-background shadow-sm" : "bg-transparent",
        )}
      >
        <span
          aria-hidden
          className={cn(
            // 좌우 여백은 두 상태에 다 있다 — 없으면 붙는 순간 제목이 옆으로 밀린다.
            // `-ml-1.5`가 그 여백을 상쇄해 글자 시작점을 본문과 맞춘다
            "-ml-1.5 rounded-md px-1.5 py-0.5 text-t5 font-semibold tabular-nums transition-colors",
            stuck
              ? "bg-brand-accent text-background"
              : "bg-transparent text-muted-foreground",
          )}
        >
          {no}
        </span>
        {children}
        {/* 해제 상태의 "장 열림" 룰. 고정되면 아래 게이지가 그 일을 이어받는다 */}
        <span
          aria-hidden
          className={cn(
            "h-px flex-1 bg-border transition-opacity",
            stuck && "opacity-0",
          )}
        />

        {/*
          진행 게이지. 트랙(회색) 위에 청록이 찬다.
          `sticky`가 이미 위치 지정 요소라 `absolute`가 이 제목을 기준으로 잡힌다.
        */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-border transition-opacity",
            stuck ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="section-progress block h-full origin-left bg-brand-accent" />
        </span>
      </h2>
    </>
  );
}
