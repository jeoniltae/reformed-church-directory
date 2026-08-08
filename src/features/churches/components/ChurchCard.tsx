// 목록의 교회 카드 한 장 — 교회명·주소·담임목사·교단 배지를 보여주고 상세로 연결한다

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Church } from "@/types/church";

export function ChurchCard({ church }: { church: Church }) {
  return (
    <Link
      href={`/churches/${church.id}`}
      className="block rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-t6 font-semibold text-foreground">{church.name}</h2>
        {church.denomination && (
          <Badge variant="secondary" className="mt-0.5">
            {church.denomination}
          </Badge>
        )}
      </div>
      <p className="mt-1 text-t4 text-muted-foreground">{church.address}</p>
      <p className="mt-1 text-t2 text-muted-foreground">
        {church.pastor} 목사
      </p>
    </Link>
  );
}
