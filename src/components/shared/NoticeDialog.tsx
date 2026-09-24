"use client";
// 공통 안내 모달 — 화면 어디서든 `showNotice()`로 띄운다. **`layout.tsx`에 한 벌만 있다**
//
// **왜 한 벌인가.** 안내는 화면마다 다른 모양일 이유가 없는데, 화면마다 만들면
// 모서리·여백·버튼 무게가 조금씩 갈린다. `FLOATING_PANEL`을 한 곳에 둔 것과 같은
// 판단이다 — **떠 있는 것들이 서로 다른 면을 가지면 깊이가 여러 겹으로 읽힌다.**
//
// ⚠️ **네이티브 `<dialog>`다. Base UI를 쓰지 않는다** (2026-09-24에 바꿨다).
// 처음에는 `@base-ui/react/alert-dialog`로 만들었는데, **모든 화면의 클라이언트 JS가
// 21KB(gzip) 늘었다** — 한 번도 안 열 수 있는 모달 때문에 `docs/seo-측정.md`가 기록한
// 홈 문서 전송량(9.2KB)의 두 배가 넘는 짐을 매번 지우는 셈이었다. 네이티브는 **0KB**다.
//
// **잃은 것은 없다 — 모양과 움직임은 원래 전부 CSS였다.** 라이브러리가 주던 것은
// 포커스 트랩·Escape·top layer뿐이고 **그 셋은 `showModal()`이 내장으로 준다.**
// 대신 **퇴장 애니메이션과 배경 스크롤 잠금은 우리가 관리한다**(아래).
//
// ⚠️ **`src/components/ui/`에 두지 않는다.** 그쪽은 shadcn 관리 영역이고 편집이
// 막혀 있다(`docs/ui-checklist.md` 원칙).

import { Info } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNoticeStore } from "./notice";

export function NoticeDialog() {
  const notice = useNoticeStore((state) => state.notice);
  const phase = useNoticeStore((state) => state.phase);
  const requestClose = useNoticeStore((state) => state.requestClose);
  const finishClose = useNoticeStore((state) => state.finishClose);

  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // 기본 표식은 중립이다. 부르는 쪽이 **누른 것과 같은 아이콘**을 넘기면 조작과 이어진다
  const Icon = notice?.icon ?? Info;

  /*
    단계를 실제 DOM에 반영한다.

    ⚠️ **`showModal()`이라야 모달이다.** `show()`는 포커스를 가두지도, top layer에
    올리지도 않는다 — 이름이 비슷해서 틀리기 쉬운 자리다.

    ⚠️ **배경 스크롤은 우리가 잠근다.** `showModal()`은 뒤를 `inert`로 만들지만
    **body 스크롤까지 막아주지는 않는다.** 클래스는 `globals.css`에 있다 — 인라인
    스타일을 쓰지 않는다는 규칙(`docs/ui-checklist.md`) 때문이다.
  */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (phase !== "closed" && !el.open) el.showModal();
    if (phase === "closed" && el.open) el.close();

    document.body.classList.toggle("notice-locked", phase !== "closed");
  }, [phase]);

  /** 언마운트될 때 잠금이 남지 않게 한다 — 남으면 **페이지 전체가 스크롤되지 않는다** */
  useEffect(() => {
    return () => document.body.classList.remove("notice-locked");
  }, []);

  return (
    /*
      **모바일은 아래에서 올라오는 시트, 넓은 화면은 가운데 카드다.**

      시트 어휘는 이 사이트에 이미 있다 — `/map`의 `ChurchListSheet`가 `rounded-t-2xl`과
      손잡이 막대를 쓴다. **같은 제스처를 뜻하는 것은 같은 모양이어야 한다.** 폭도
      탭바·시트와 같은 `max-w-2xl`이다.

      ⚠️ **모바일에서 가운데 띄우지 않는다.** 엄지가 닿는 곳은 화면 아래이고, 이
      사이트의 조작은 전부 거기서 일어난다(탭바·시트·전화 버튼).

      ⚠️ **`z-index`가 없다.** 네이티브 모달은 top layer라 문서의 쌓임 맥락 바깥에 선다
      — 카카오 SDK가 컨테이너 안에 무슨 값을 넣든 항상 위다(Base UI 시절의 `z-50`은
      이제 필요 없어서 지웠다).

      **UA 기본 스타일을 전부 덮는다** — `<dialog>`는 자체 `margin: auto`·테두리·여백을
      갖고 있어서, 남겨 두면 시트가 화면 가운데에 흰 상자로 뜬다.
    */
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-state={phase}
      /*
        Escape를 가로챈다. **막는 것이 아니라 우리 경로로 돌리는 것이다** —
        기본 동작은 즉시 닫기라 퇴장 애니메이션이 잘린다. store를 거치면 `closing`을
        지나 같은 모습으로 내려간다.
      */
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      /*
        퇴장이 끝나면 진짜로 닫는다.

        ⚠️ **두 가지를 걸러야 한다.** 이 핸들러에는 **자식의 계단 애니메이션**과
        **`::backdrop`의 페이드**까지 올라온다. 거르지 않으면 **내용이 아직 들어오는
        중에 모달이 닫힌다.**
        - `event.target !== event.currentTarget` → 자식 것
        - `pseudoElement`가 비어 있지 않음 → `::backdrop` 것
      */
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if ((event.nativeEvent as AnimationEvent).pseudoElement) return;
        if (phase === "closing") finishClose();
      }}
      className={cn(
        // UA 기본값 덮기 — 여백·테두리·최대폭·자동 가운데 정렬을 전부 우리가 정한다
        "m-0 max-h-none max-w-none border-0 bg-transparent p-0",
        "fixed inset-x-0 top-auto bottom-0 mx-auto w-full max-w-2xl",
        // 넓은 화면에서는 바닥을 떠나 가운데 선다
        "sm:top-1/2 sm:bottom-auto sm:max-w-sm sm:-translate-y-1/2",
        // 배경 막 — `::backdrop`은 top layer의 형제라 우리 엘리먼트가 아니다
        "backdrop:bg-foreground/30 backdrop:backdrop-blur-sm",
        "data-[state=open]:backdrop:animate-in data-[state=open]:backdrop:fade-in-0 data-[state=open]:backdrop:duration-200",
        "data-[state=closing]:backdrop:animate-out data-[state=closing]:backdrop:fade-out-0 data-[state=closing]:backdrop:duration-200",
        // 모바일은 올라오고, 넓은 화면은 제자리에서 자란다
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-8 data-[state=open]:duration-300",
        "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:zoom-in-95",
        "data-[state=closing]:animate-out data-[state=closing]:fade-out-0 data-[state=closing]:slide-out-to-bottom-8 data-[state=closing]:duration-200",
        "sm:data-[state=closing]:slide-out-to-bottom-0 sm:data-[state=closing]:zoom-out-95",
      )}
    >
      {/* 면과 모서리는 안쪽 상자가 갖는다 — `<dialog>` 자신은 자리만 잡는다 */}
      <div className="rounded-t-2xl border-t border-border bg-popover px-6 pt-4 pb-8 shadow-lg sm:rounded-2xl sm:border sm:p-7">
        {/*
          손잡이 막대 — **`ChurchListSheet`와 같은 값이다**(`h-1 w-10 rounded-full
          bg-border`). 장식이라 스크린리더에서 감춘다.

          ⚠️ **넓은 화면에서는 뺀다.** 거기서는 카드이지 끌어올린 시트가 아니라,
          남겨 두면 **할 수 없는 조작을 할 수 있다고 말하는 꼴**이 된다.
        */}
        <span
          aria-hidden
          className="mx-auto mb-5 block h-1 w-10 rounded-full bg-border sm:hidden"
        />

        {/* 내용이 순서대로 들어온다 — 계단은 `globals.css`의 `.notice-stagger` */}
        <div className="notice-stagger flex flex-col items-center text-center">
          {/*
            표식. **천천히 숨 쉬는 테두리가 "준비 중"과 같은 것을 말한다** —
            멈춘 것이 아니라 진행 중이라는 뜻이다.

            ⚠️ **경고가 아니라 안내다.** `ChurchNotice`가 붉은 상자를 버린 것과 같은
            규칙이라 `destructive`를 쓰지 않고, 빠르게 깜빡이지도 않는다.
          */}
          <span className="relative grid size-14 place-items-center rounded-full bg-muted">
            <span
              aria-hidden
              className="notice-breathe absolute inset-0 rounded-full ring-1 ring-border"
            />
            <Icon aria-hidden className="size-6 text-muted-foreground" />
          </span>

          <h2
            id={titleId}
            className="mt-4 text-t6 font-bold break-keep text-foreground"
          >
            {notice?.title}
          </h2>

          {/*
            ⚠️ **`break-keep`이 빠지면 낱말 가운데가 끊긴다.** 한글은 기본값에서
            글자 사이 어디서나 줄이 바뀌어 `있어 / 요.` 같은 줄바꿈이 나온다
            (실측으로 그렇게 나왔다). `keep-all`은 **띄어쓰기에서만** 끊는다.

            `text-balance`와 짝으로 쓴다 — 균형을 맞추되 낱말은 지킨다.
          */}
          <p
            id={descriptionId}
            className="mt-2 text-t4 text-balance break-keep text-muted-foreground"
          >
            {notice?.description}
          </p>

          {/*
            ⚠️ **이 모달의 유일한 행동이라 brand-solid를 쓴다.** "화면당 solid 하나"
            규칙과 부딪치는 것처럼 보이지만, 모달은 **막 뒤의 화면을 덮은 별도 층**이고
            그 층에서 누를 수 있는 것은 이것뿐이다.

            **높이·글자는 상세의 전화 버튼과 같다**(`h-12 text-t5`) — 이 사이트에서
            "가장 중요한 버튼"의 크기는 한 벌이어야 한다.

            ⚠️ **`autoFocus`를 주지 않는다.** `showModal()`이 첫 포커스 대상을 알아서
            잡고, 여기 강제로 주면 **열자마자 초점 링이 떠서 경보처럼 보인다.**
          */}
          <button
            type="button"
            onClick={requestClose}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 h-12 w-full text-t5 font-semibold",
            )}
          >
            {notice?.confirmLabel ?? "확인"}
          </button>

          {notice?.footnote && (
            <p className="mt-3 text-t2 break-keep text-muted-foreground">
              {notice.footnote}
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
