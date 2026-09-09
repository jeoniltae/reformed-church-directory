// 홈 미리보기 목록의 교회 한 줄 — 카드보다 가벼운 행 형태

import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { Badge } from "@/components/ui/badge";
import type { Church } from "@/types/church";

export function ChurchRow({ church }: { church: Church }) {
  const place = church.subRegion
    ? `${church.region} ${church.subRegion}`
    : church.region;

  return (
    <Link
      href={`/churches/${church.id}`}
      transitionTypes={NAV_FORWARD}
      // 누름 상태는 `ChurchCard`와 같은 어휘다 — 같은 상세로 가는 같은 조작이라
      // 홈에서 눌렀을 때와 목록에서 눌렀을 때가 달라 보일 이유가 없다.
      // 여기는 중첩된 링크가 없어 `has-[]`로 범위를 좁힐 필요가 없다
      className="flex items-center gap-3 py-4 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:bg-muted"
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-t4 font-semibold text-muted-foreground"
      >
        {[...church.name][0]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-t5 font-semibold text-foreground">
          {church.name}
        </span>
        <span className="mt-1 block truncate text-t4 text-muted-foreground">
          {place} · {church.pastor} 목사
        </span>
      </span>
      {church.denomination && (
        <Badge variant="secondary" className="shrink-0">
          {church.denomination}
        </Badge>
      )}
    </Link>
  );
}
