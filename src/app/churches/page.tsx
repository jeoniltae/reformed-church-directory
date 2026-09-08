// 교회 목록·검색 화면 — 전량을 클라이언트에 넘겨 입력 즉시 필터링한다

import type { Metadata } from "next";
import { DataNotice } from "@/components/shared/DataNotice";
import { PageTransition } from "@/components/shared/PageTransition";
import { SiteMark } from "@/components/shared/SiteMark";
import { ChurchDirectory } from "@/features/churches/components/ChurchDirectory";
import { getAllChurches } from "@/features/churches/data";
import { collectRegionCounts } from "@/features/churches/search";

export const metadata: Metadata = {
  title: "교회 찾기",
  description:
    "국내 개혁주의 교회를 교회명·주소·담임목사·지역으로 검색합니다.",
  alternates: { canonical: "/churches" },
};

export default function ChurchesPage() {
  const churches = getAllChurches();
  // 홈의 수록 현황 카드와 같은 출처를 쓴다 — 두 화면이 다른 숫자를 말하면 안 된다
  const regions = collectRegionCounts(churches);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8">
        {/* 되돌아가기 줄이 없는 화면이라 제목 위에 한 줄로 둔다 */}
        <SiteMark className="mb-3" />
        {/*
          **h1은 사이트가 아니라 이 화면이 무엇인지 말한다.** 예전에는
          `개혁주의 교회 디렉토리`(사이트명)였는데, 그러면 문서 제목·breadcrumb가
          부르는 이름(`교회 찾기`)과 화면만 어긋나고 h1이 정보를 더하지 못한다.
          위 SiteMark가 이미 사이트명을 말하므로 여기서 반복할 이유도 없다.

          **크기는 t9다** — 탭 루트(홈·검색·지도)는 같은 급이라 홈 h1과 맞춘다.
          지역·교단 랜딩은 그 아래라 t8로 남는다.
        */}
        <h1 className="text-t9 font-bold text-foreground">교회 찾기</h1>
        {/*
          수록 건수는 이 화면에서 가장 구체적인 사실인데 회색 문장에 묻혀 있었다.
          **홈처럼 카드로 만들지 않는다** — 그러면 홈의 유일한 brand-solid를 복제하게
          된다. 숫자만 본문색·semibold로 올리고 지역 수를 더해 아래 지역 칩과 잇는다.
        */}
        <p className="mt-1 mb-5 text-t4 text-muted-foreground">
          국내 개혁주의 교회{" "}
          <strong className="font-semibold text-foreground">
            {churches.length}곳
          </strong>{" "}
          · {regions.length}개 지역
        </p>
        <ChurchDirectory churches={churches} />
        <DataNotice />
      </main>
    </PageTransition>
  );
}
