"use client";
// 오프라인일 때 앱 내부 이동을 막는다 — 크롬 오류 화면으로 튕겨 나가는 것을 막는 장치다.
//
// **왜 필요한가 (2026-09-11 실측).** 오프라인에서 교회 카드를 탭하면 RSC 페이로드
// fetch가 `ERR_INTERNET_DISCONNECTED`로 실패하고, **Next가 하드 내비게이션으로
// 폴백하면서 문서가 `chrome-error://chromewebdata/`로 교체된다.** 탭바까지 사라져
// 앱이 통째로 없어지고, **네트워크가 돌아와도 자동으로 복구되지 않는다**(URL이 `/`로
// 남아 수동 새로고침이 필요하다). 지하철에서 교회 하나 눌렀다가 앱에서 튕겨 나가고
// 지상에 나와도 멈춰 있는 상태가 된다.
//
// **이 사이트는 오프라인에서도 대부분 멀쩡하다는 것이 판단의 근거다.** 전 라우트가
// Static/SSG라 한 번 열리면 89건이 이미 손에 있어 검색·지역/교단 필터가 그대로
// 동작한다(실측 확인). 잃는 것은 "다른 화면으로 넘어가기"뿐이다. 그래서 **넘어가기만
// 막고 나머지는 그대로 쓰게 두는 것**이 이 화면에서 가장 손해가 적다.
//
// **링크마다 고치지 않고 한 곳에서 잡는다.** 앱 내부로 가는 `<Link>`가 16개 파일에
// 흩어져 있고, 이 프로젝트는 `transitionTypes`를 새 링크에 빼먹어 전환이 조용히
// 죽은 전례가 있다(CLAUDE.md). 문서 캡처 단계에서 한 번 잡으면 **앞으로 추가되는
// 링크도 자동으로 덮인다.**
//
// ⚠️ **`navigator.onLine === false`만 믿는다.** `true`는 "네트워크 인터페이스가 있다"는
// 뜻일 뿐이라 캡티브 포털·DNS 실패·죽은 와이파이에서도 `true`다. 그래서 이 가드는
// **확실히 끊긴 경우만** 막고, "온라인인데 실제로는 안 되는" 경우는 못 잡는다.
// 그 경우까지 덮으려면 Service Worker가 필요하며 별건이다.

import { useEffect, useRef, useState } from "react";

/** 안내를 띄워 두는 시간. 조작을 막았다는 사실만 전하면 되므로 짧게 둔다 */
const NOTICE_MS = 4000;

export function OfflineGuard() {
  const [blocked, setBlocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // 확실히 끊겼을 때만 개입한다. 위 ⚠️ 참고
      if (navigator.onLine) return;
      // 이미 누군가 처리했거나, 새 탭·가운데 클릭처럼 브라우저에 맡길 조작은 두고 본다
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      // `/`로 시작하는 것만 앱 내부 이동이다. `tel:`·`mailto:`·외부 주소·`#` 앵커는
      // 네트워크가 없어도 되거나 어차피 사이트를 떠나므로 건드리지 않는다.
      // **전화 걸기는 특히 막으면 안 된다** — 오프라인에서도 되고 이 사이트의 핵심 동선이다.
      if (!href?.startsWith("/")) return;

      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      /*
        **`preventDefault`와 `stopPropagation`이 둘 다 필요하다.**
        전자는 평범한 `<a>`의 기본 이동을, 후자는 React 루트에 달린 합성 이벤트
        (Next `<Link>`의 onClick)를 막는다. 캡처 단계라 React보다 먼저 선다.
      */
      event.preventDefault();
      event.stopPropagation();

      setBlocked(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setBlocked(false), NOTICE_MS);
    };

    document.addEventListener("click", onClick, true);
    // 연결이 돌아오면 안내를 기다리지 않고 바로 걷는다
    const onOnline = () => setBlocked(false);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("online", onOnline);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!blocked) return null;

  return (
    /*
      탭바(`z-10`, 높이 64px) 위에 띄운다. `bottom-20`(80px)이 탭바와 16px을 띄운다.

      **`destructive`를 쓰지 않는다.** 붉은 상자는 무언가 망가졌다는 뜻인데 실제로는
      연결만 없고 앱은 멀쩡하다 — `ChurchNotice`가 "경고가 아니라 안내"로 판단한 것과
      같은 기준이다. 두 번째 줄이 그 사실("검색은 그대로 쓸 수 있다")을 직접 말한다.
    */
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-20 z-20 mx-auto w-fit max-w-lg rounded-lg border border-border bg-card px-4 py-3 text-center shadow-lg"
    >
      <p className="text-t4 font-semibold text-foreground">
        인터넷 연결이 끊겨 화면을 열 수 없습니다
      </p>
      <p className="mt-1 text-t2 text-muted-foreground">
        검색과 지금 화면은 그대로 쓸 수 있습니다.
      </p>
    </div>
  );
}
