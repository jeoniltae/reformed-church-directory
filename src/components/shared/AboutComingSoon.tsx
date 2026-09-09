"use client";
// 홈의 "사이트 소개" 보조 링크 — 목적지 화면이 아직 없어 누르면 이동 대신
// 제자리에서 안내를 펼친다.
//
// **임시 컴포넌트다.** `/about`(가칭) 페이지가 생기면 이 컴포넌트를 지우고
// 그 자리를 `<Link href="/about" transitionTypes={NAV_FORWARD}>`로 바꾼다.
// `tab-nav.ts`는 탭 밖 화면을 자동으로 처리하므로 그때도 별도 등록은 필요 없다
// (`/report`·`/privacy`가 이미 그렇게 동작한다).
//
// **`<Link>`가 아니라 `<button>`이다.** 이동이 없는 조작이라 href가 없다.
// 링크로 두면 프리페치·View Transition 방향 계산이 의미 없이 걸린다.
//
// **`ChurchNotice`와 같은 어휘를 쓴다.** 경고가 아니라 안내이므로 destructive를
// 쓰지 않는다 — "준비 중"은 결함이 아니라 진행 상태다. brand-solid도 쓰지 않는다
// (화면당 하나 원칙 — 이 화면의 solid는 위 검색 CTA 카드가 이미 가져갔다).

import { ChevronDown, Info } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function AboutComingSoon() {
  const [open, setOpen] = useState(false);
  // 버튼과 펼쳐지는 안내를 스크린리더에서 명시적으로 잇는다
  const panelId = useId();

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-t4 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        이 사이트는 어떻게 만들어졌나요?
        {/* 화살표가 아니라 셰브런이다 — 어딘가로 이동하는 게 아니라 제자리에서
            펼쳐진다는 뜻을 전달해야 한다. 열리면 뒤집혀 "접기"로 읽힌다 */}
        <ChevronDown
          aria-hidden
          className={cn(
            "size-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <aside
          id={panelId}
          className="mt-2 flex gap-2.5 rounded-lg border border-border p-3"
        >
          <Info
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          />
          <p className="text-t4 text-foreground">
            소개 페이지를 준비 중입니다. 곧 만나보실 수 있어요.
          </p>
        </aside>
      )}
    </div>
  );
}
