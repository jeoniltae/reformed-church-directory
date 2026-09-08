// 축약 로고 — 마크 + 사이트명 한 줄. 홈으로 가는 링크다.
//
// **왜 필요한가.** 검색으로 교회 상세에 바로 들어온 사람은 사이트명을 한 글자도 못
// 본다. 문서 제목(브라우저 탭)에만 있고 화면에는 없다. 상세 89개를 SSG로 굽고
// sitemap에 넣은 이유가 검색 유입인데, 정작 그 사람들이 여기가 어디인지 모른다.
//
// **전역 헤더를 만들지 않았다 (2026-09-08 결정).** 하단 탭바가 이미 64px을 상시
// 점유해서 위에도 띠를 두면 667px 화면에서 크롬이 19%가 된다. 대신 각 화면에 이미
// 있는 되돌아가기 줄의 빈 오른쪽을 쓴다 — **세로를 1px도 더 쓰지 않는다.**
// CLAUDE.md의 "헤더를 다시 만들지 않는다"도 그대로 지켜진다. 검토 내역은
// `docs/디자인-고도화.md` 참조.
//
// **홈에는 쓰지 않는다.** 홈 히어로에 영문 서브라인까지 갖춘 전체 락업이 있다.
// 이건 그 축약형이라 같은 화면에 둘 다 나오면 안 된다. **`/churches`에도 쓰지
// 않는다** — 그 화면의 h1이 이미 사이트명이라 이름이 두 번 나온다.

import Image from "next/image";
import Link from "next/link";
import { NAV_BACK } from "@/components/shared/PageTransition";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      /*
        홈은 첫 번째 탭이라 **어느 화면에서 가든 되돌아가는 이동이다** —
        `tab-nav.ts`의 `tabDirection()`이 내는 결론과 같다(탭 밖 화면도 NAV_BACK).
        이 컴포넌트를 홈에서는 쓰지 않으므로 "현재 탭을 다시 누른" 경우가 없다.
      */
      transitionTypes={NAV_BACK}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg text-t2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      {/*
        마크는 `/icon.png` — 파비콘·매니페스트·OG·홈 락업과 같은 파일이라
        로고를 바꿔도 `icon.png` 하나만 갈아끼우면 된다.
        **쿼리 없는 경로를 쓴다**(Next가 붙이는 해시는 빌드마다 달라진다).
      */}
      <Image src="/icon.png" alt="" width={18} height={18} className="rounded-sm" />
      {SITE_NAME}
    </Link>
  );
}
