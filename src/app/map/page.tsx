// 지도 — 수록 교회를 전국 지도에 찍는다. **화면 전체가 지도다**
//
// ⚠️ **이 화면에는 세로 스크롤이 없다** (2026-09-20 결정). 지도는 손가락으로 끌고
// 오므리는 조작이 전부라, 페이지가 함께 스크롤되면 **지도를 끌려던 손가락이 화면을
// 넘긴다.** 그래서 높이를 뷰포트에 딱 맞추고 **제목·안내는 지도 위에 띄운다** —
// 세로를 1px도 먹지 않는다. 경위는 `docs/지도-작업.md`의 "지도 디자인 고도화"에 있다.

import type { Metadata } from "next";
import { PageTransition } from "@/components/shared/PageTransition";
import { MapScreen } from "@/features/churches/components/MapScreen";
import { getAllChurches } from "@/features/churches/data";
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
      "전국 개혁주의 교회의 위치를 지도에서 봅니다. 마커를 누르면 교회 상세로 이동합니다.",
    path: "/map",
  }),
  /**
   * **아직 색인하지 않는다 — 다만 이제 열 수 있는 상태다.** 2026-09-04에 "준비 중
   * 안내라 soft 404 위험"을 근거로 막았고, 전체화면으로 바꾸며 글자가 91자까지 줄어
   * 그 위험이 되살아났었다. **목록 시트로 글자와 링크가 돌아왔다**(`ChurchListSheet`).
   * 실제로 여는 것은 8단계 출시 커밋에서 sitemap 제외·`CLAUDE.md`와 **한 번에** 한다.
   *
   * `follow`는 그대로 남긴다 — 크롤러가 여기서 교회 상세로 넘어가는 길은 막지 않는다.
   */
  robots: { index: false, follow: true },
};

export default function MapPage() {
  const churches = getAllChurches();

  return (
    <PageTransition>
      {/*
        **높이를 뷰포트에 맞춰 스크롤을 없앤다.** `4rem`은 `layout.tsx`가 고정 탭바
        자리로 비워 둔 `pb-16`과 같은 값이다 — 둘을 더하면 정확히 한 화면이 된다.
        ⚠️ **`100vh`가 아니라 `100svh`다.** 모바일에서 주소창이 접히고 펴질 때
        `vh`는 값이 튀어 **화면이 아래위로 흔들린다.**
      */}
      <main className="relative h-[calc(100svh-4rem)] w-full">
        {/*
          **화면 전체가 `MapScreen` 하나다** — 지도·제목·검색·내 위치·목록 시트가
          "고른 교회"와 검색어를 나눠 쓰므로 클라이언트 래퍼가 감싼다.

          ⚠️ **h1도 그 안에 있다.** 클라이언트 컴포넌트라도 서버에서 한 번 그려지므로
          **정적 HTML에는 그대로 들어간다** — 색인에 영향이 없다.
        */}
        <MapScreen churches={churches} />


      </main>
    </PageTransition>
  );
}
