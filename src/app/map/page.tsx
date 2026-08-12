// 지도 — 좌표 확보와 지도 SDK 도입 전까지의 안내 화면

import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "지도",
  description: "개혁주의 교회 지도는 준비 중입니다.",
  alternates: { canonical: "/map" },
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
        <Link
          href="/churches"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          목록에서 찾기
        </Link>
      </main>
    </PageTransition>
  );
}
