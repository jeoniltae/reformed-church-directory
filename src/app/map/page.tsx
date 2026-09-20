// 지도 — 수록 교회를 전국 지도에 찍는다. **화면 전체가 지도다**
//
// ⚠️ **이 화면에는 세로 스크롤이 없다** (2026-09-20 결정). 지도는 손가락으로 끌고
// 오므리는 조작이 전부라, 페이지가 함께 스크롤되면 **지도를 끌려던 손가락이 화면을
// 넘긴다.** 그래서 높이를 뷰포트에 딱 맞추고 **제목·안내는 지도 위에 띄운다** —
// 세로를 1px도 먹지 않는다. 경위는 `docs/지도-작업.md`의 "지도 디자인 고도화"에 있다.

import type { Metadata } from "next";
import { PageTransition } from "@/components/shared/PageTransition";
import { SiteMark } from "@/components/shared/SiteMark";
import { MapScreen } from "@/features/churches/components/MapScreen";
import { getAllChurches } from "@/features/churches/data";
import { hasCoords } from "@/features/churches/map/points";
import { pageMetadata } from "@/lib/site";
import { cn } from "@/lib/utils";

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

/** 지도 위에 띄우는 판의 공통 표면 — 지도 위에서도 글자가 읽혀야 한다 */
const FLOATING =
  "pointer-events-auto rounded-lg border border-border bg-background/95 shadow-md backdrop-blur-sm";

export default function MapPage() {
  const churches = getAllChurches();
  // 지도에 찍히는 수는 수록 수와 다르다. **판정은 `hasCoords` 하나로 모았다**
  const located = churches.filter(hasCoords).length;

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
          **지도와 목록 시트.** 둘이 "고른 교회" 하나를 나눠 쓰므로 클라이언트 래퍼가
          감싼다(`MapScreen`). 마커를 누르면 시트가 그 교회를 띄우고, 이름표는
          **묶이지 않은 마커에 언제나** 붙는다.

          ⚠️ **아래 제목 카드보다 먼저 와야 한다.** 지도는 `absolute inset-0`이라
          **DOM에서 뒤에 두면 카드를 덮는다**(2026-09-21에 실제로 그렇게 만들었다).
          둘 다 z-index를 쓰지 않고 순서로만 겹침을 정한다.
        */}
        <MapScreen churches={churches} />

        {/*
          제목 — **지도 위에 띄운다.** 세로를 먹지 않으면서 이 화면이 어느 사이트의
          무엇인지 말한다. 카카오맵·네이버지도가 검색창을 띄우는 자리와 같다.

          ⚠️ **바깥 상자는 `pointer-events-none`이다.** 안 그러면 제목 옆 빈 자리를
          끌어도 지도가 따라오지 않는다 — **조작을 먹는 띠가 생긴다.**
        */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex">
          <div className={cn(FLOATING, "max-w-full px-3 py-2")}>
            <SiteMark />
            {/* 탭 루트라 홈·`/churches`와 같은 t9다. 이름 규칙은 위 `title` 주석 참고 */}
            <h1 className="mt-1 text-t9 font-bold text-foreground">
              전국 교회 지도
            </h1>
            {/*
              ⚠️ **두 숫자가 같으면 뒷말을 붙이지 않는다.** 좌표가 전부 채워지면
              `92곳 · 지도에 92곳`이 되어 같은 값을 두 번 읽히는 꼴이다. 지금은
              전부 채워져 있지만 **확장하면 다시 갈린다** — 조건을 지워 두지 않는다.
            */}
            <p className="mt-0.5 text-t2 text-muted-foreground">
              국내 개혁주의 교회{" "}
              <strong className="font-semibold text-foreground">
                {churches.length}곳
              </strong>
              {located < churches.length && ` · 지도에 ${located}곳`}
            </p>
          </div>
        </div>

      </main>
    </PageTransition>
  );
}
