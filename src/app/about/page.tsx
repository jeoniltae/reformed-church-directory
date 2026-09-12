// 소개 화면 — 이 사이트를 만든 이유와 개혁주의 신앙의 배경을 설명한다
//
// ⚠️ **폴더명이 `about`인 것은 ASCII여야 하기 때문이다.** `/소개`로 만들면
// prerender 단계에서 `InvalidCharacterError`로 **빌드가 죽는다**(2026-09-05 실측,
// CLAUDE.md). Next의 세그먼트 캐시가 경로를 base64로 인코딩하는데 `btoa`는
// Latin-1만 받는다. **한글 파라미터 값은 멀쩡하다** — 정적 세그먼트만 ASCII로 둔다.
//
// **상단은 `/report`·`/privacy`와 같은 구성이다** — `SiteMark` + `h1`, 되돌아가기
// 줄 없음. 시안에는 뒤로가기 화살표가 있었으나 **`SiteMark`가 이미 홈으로 가는
// 링크라, 같은 곳으로 가는 링크가 둘이 된다.** 시안의 이어비로우
// (`REFORMED CHURCH DIRECTORY`)도 `SiteMark`가 하던 일이라 뺐다.
//
// **h1은 `소개`다.** 시안의 `흩어진 개혁주의 교회 정보를 한곳에`는 이름이 아니라
// 태그라인이라 리드 문장으로 내렸다. h1을 태그라인으로 두면 `metadata.title`·
// breadcrumb가 부르는 이름과 화면만 어긋난다 — `/churches`에서 겪고 h1을
// `교회 찾기`로 고친 것과 같은 문제다(2026-09-08).

import type { Metadata } from "next";
import {
  PageTransition,
} from "@/components/shared/PageTransition";
import { SiteMark } from "@/components/shared/SiteMark";

export const metadata: Metadata = {
  title: "소개",
  description:
    "개혁주의 교회 디렉토리를 만든 이유와 개혁주의 신앙의 역사·표준 문서를 소개합니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    /*
      **`PageTransition`은 각 `page.tsx`가 감싼다.** `layout.tsx`로 올리면
      `enter`/`exit`가 마운트·언마운트에서만 발동하는데 레이아웃의 래퍼는 계속
      살아 있어 전환이 통째로 죽는다.
    */
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        {/* 되돌아가기 줄이 없는 화면이라 제목 위에 한 줄로 둔다 (`/report`와 같다) */}
        <SiteMark className="mb-3" />
        <h1 className="text-t8 font-bold text-foreground">소개</h1>
        <p className="mt-1 text-t4 text-muted-foreground">
          흩어진 개혁주의 교회 정보를 한곳에 모았습니다.
        </p>

        {/* 본문 6절은 3단계에서 채운다 — 01 만든 이유 · 02 역사 · 03 TULIP ·
            04 표준 문서 · 05 용어 정리 · 06 이 사이트가 하는 일 */}
      </main>
    </PageTransition>
  );
}
