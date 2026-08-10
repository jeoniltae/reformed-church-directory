// 목록의 교회 카드 한 장 — 모노그램·주소·담임목사·교단 배지에 전화 걸기 버튼을 붙인다

import { MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";

export function ChurchCard({ church }: { church: Church }) {
  return (
    // 카드 전체가 상세로 이어지지만 전화 링크는 그 위에 따로 선다.
    // <a> 안에 <a>를 넣을 수 없어 제목 링크를 카드 넓이만큼 늘리는 방식을 쓴다
    <div className="relative flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-t5 font-semibold text-muted-foreground"
      >
        {[...church.name][0]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/churches/${church.id}`}
            className="truncate text-t6 font-semibold text-foreground outline-none after:absolute after:inset-0"
          >
            {church.name}
          </Link>
          {church.denomination && (
            <Badge variant="secondary" className="mt-0.5 shrink-0">
              {church.denomination}
            </Badge>
          )}
        </div>
        <p className="mt-1.5 flex gap-1.5 text-t4 text-muted-foreground">
          <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {church.address}
        </p>
        <p className="mt-1 flex gap-1.5 text-t2 text-muted-foreground">
          <User aria-hidden className="mt-0.5 size-3 shrink-0" />
          {church.pastor} 목사
        </p>
      </div>

      {church.phone && (
        <a
          href={`tel:${church.phone}`}
          aria-label={`${church.name} 전화 걸기`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "icon" }),
            "relative self-center",
          )}
        >
          <Phone aria-hidden />
        </a>
      )}
    </div>
  );
}
