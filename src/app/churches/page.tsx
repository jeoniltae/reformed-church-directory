// 교회 목록·검색 화면 — 전량을 클라이언트에 넘겨 입력 즉시 필터링한다

import type { Metadata } from "next";
import { ChurchDirectory } from "@/features/churches/components/ChurchDirectory";
import { getAllChurches } from "@/features/churches/data";

export const metadata: Metadata = {
  title: "교회 찾기",
  description:
    "국내 개혁주의 교회를 교회명·주소·담임목사·지역으로 검색합니다.",
  alternates: { canonical: "/churches" },
};

export default function ChurchesPage() {
  const churches = getAllChurches();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8">
      <h1 className="text-t8 font-bold text-foreground">
        개혁주의 교회 디렉토리
      </h1>
      <p className="mt-1 mb-5 text-t4 text-muted-foreground">
        국내 개혁주의 교회 {churches.length}곳을 수록했습니다.
      </p>
      <ChurchDirectory churches={churches} />
    </main>
  );
}
