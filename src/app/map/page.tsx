// 지도 — 좌표 확보와 지도 SDK 도입 전까지의 안내 화면

import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { NAV_BACK, PageTransition } from "@/components/shared/PageTransition";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "지도",
  description: "개혁주의 교회 지도는 준비 중입니다.",
  alternates: { canonical: "/map" },
  /**
   * **색인하지 않는다 (2026-09-04 결정).** "준비 중" 안내만 있어 검색 노출 가치가
   * 없고, 내용 없는 페이지는 soft 404로 판정될 위험이 있다. sitemap에서도 빠져 있다
   * (`src/lib/indexable-paths.ts`).
   *
   * `follow`는 남긴다 — 크롤러가 여기서 목록 화면으로 넘어가는 길은 막지 않는다.
   * **실제 지도가 붙는 7단계에서 이 블록과 sitemap 제외를 함께 푼다.**
   */
  robots: { index: false, follow: true },
};

export default function MapPage() {
  return (
    <PageTransition>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <MapPin aria-hidden className="size-8 text-muted-foreground" />
        <h1 className="text-t6 font-semibold text-foreground">
          지도는 준비 중입니다
        </h1>
        <p className="text-t4 text-muted-foreground">
          교회 위치 좌표를 확보하고 있습니다. 준비되는 대로 지도에서 주변 교회를
          찾을 수 있게 하겠습니다.
        </p>
        {/*
          Base UI Button은 네이티브 <button>을 전제하므로 링크에는 variant만 빌려 쓴다.
          cn()을 거치지 않으면 base의 border-transparent가 outline의 border-border를 덮는다.
        */}
        {/* 지도(2) → 검색(1)이라 왼쪽으로 되돌아간다 */}
        <Link
          href="/churches"
          transitionTypes={NAV_BACK}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          목록에서 찾기
        </Link>
      </main>
    </PageTransition>
  );
}
