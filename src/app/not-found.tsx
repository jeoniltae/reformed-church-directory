// 404 — 없는 교회 id로 들어왔을 때. 상세 페이지의 notFound() 호출과 짝이다

import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "찾을 수 없는 페이지",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <SearchX aria-hidden className="size-8 text-muted-foreground" />
      <h1 className="text-t6 font-semibold text-foreground">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-t4 text-muted-foreground">
        주소가 바뀌었거나 삭제된 교회일 수 있습니다.
      </p>
      <Link
        href="/churches"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        교회 목록으로
      </Link>
    </main>
  );
}
