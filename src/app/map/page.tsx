// 지도 — 수록 교회를 전국 지도에 찍고, 같은 화면에서 목록으로 오갈 수 있다

import type { Metadata } from "next";
import { DataNotice } from "@/components/shared/DataNotice";
import { PageTransition } from "@/components/shared/PageTransition";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { SiteMark } from "@/components/shared/SiteMark";
import { ChurchMapView } from "@/features/churches/components/ChurchMapView";
import { getAllChurches } from "@/features/churches/data";
import { hasCoords } from "@/features/churches/map/points";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  /*
    ⚠️ **`title`과 아래 h1은 언제나 같은 이름이어야 한다.** `/churches`가 h1을
    `교회 찾기`로 고치며 세운 규칙이고, 문서 제목·breadcrumb가 부르는 이름과 화면이
    어긋나면 h1이 정보를 더하지 못한다. **여기를 고치면 h1도 함께 고친다.**
  */
  ...pageMetadata({
    title: "전국 교회 지도",
    description:
      "전국 개혁주의 교회의 위치를 지도에서 봅니다. 목록 보기로 전환할 수 있습니다.",
    path: "/map",
  }),
  /**
   * **아직 색인하지 않는다.** 2026-09-04에 "준비 중 안내라 soft 404 위험"을 근거로
   * 막았고, **그 근거는 지도가 붙은 지금 사라졌다.** 다만 되돌리기는 sitemap 제외
   * (`src/lib/indexable-paths.ts`)·`CLAUDE.md`와 함께 **출시 커밋 한 번에 푼다** —
   * 나눠 하면 **지도는 떴는데 색인은 막힌 상태**가 남는다(`docs/지도-작업.md` 8단계).
   *
   * `follow`는 그대로 남긴다 — 크롤러가 여기서 교회 상세로 넘어가는 길은 막지 않는다.
   */
  robots: { index: false, follow: true },
};

export default function MapPage() {
  const churches = getAllChurches();
  // 지도에 찍히는 수는 수록 수와 다르다. **판정은 `hasCoords` 하나로 모았다**
  const located = churches.filter(hasCoords).length;

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8">
        {/*
          되돌아가기 줄이 없는 화면이라 제목 위에 한 줄로 둔다 — `/churches`와 같다.

          **2026-09-08에는 제외했다가 2026-09-20에 넣었다.** 그때 근거는 ①세로 중앙
          정렬이라 상단 줄이 레이아웃과 싸운다 ②`noindex`라 검색 유입이 없다 였는데,
          **지도가 붙으면서 둘 다 사라졌다**(흐름 레이아웃이 됐고 8단계에서 색인을 연다).
          그러면 **검색으로 여기 바로 들어온 사람이 사이트명을 한 글자도 못 본다** —
          `SiteMark`가 만들어진 이유 그 자체다. 경위는 `docs/디자인-고도화.md`에 있다.
        */}
        <SiteMark className="mb-3" />
        {/*
          탭 루트라 홈·`/churches`와 같은 t9다.

          **이름은 `교회 + 화면이 하는 일` 형식이다** — `/churches`의 `교회 찾기`와
          짝이 된다. ⚠️ **`개혁주의`를 넣지 않는다** — 바로 위 `SiteMark`가
          `개혁주의 교회 디렉토리`라 글자가 겹친다(`/churches`가 같은 이유로
          `개혁주의 교회 찾기`를 버렸다).

          **`전국`은 과장이 아니다** — 수록 교회가 **시도 16곳 전부에 있다**(2026-09-20 실측).
          한 곳이라도 비면 이 글자부터 다시 본다.
        */}
        <h1 className="text-t9 font-bold text-foreground">전국 교회 지도</h1>
        {/*
          `/churches`의 수록 줄과 같은 문법이다. **여기서는 지도에 찍히는 수를 함께
          말한다** — 두 숫자가 다른 이유는 아래 안내 줄이 잇는다.
        */}
        <p className="mt-1 mb-5 text-t4 text-muted-foreground">
          국내 개혁주의 교회{" "}
          <strong className="font-semibold text-foreground">
            {churches.length}곳
          </strong>{" "}
          · 지도에 {located}곳
        </p>

        <ChurchMapView churches={churches} />

        {/* 목록 보기가 91장이라 길다. 지도 보기에서는 임계값에 못 닿아 뜨지 않는다 */}
        <ScrollToTop />
        <DataNotice />
      </main>
    </PageTransition>
  );
}
