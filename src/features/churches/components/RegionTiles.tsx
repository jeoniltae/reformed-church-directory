// 홈의 지역 타일 — 건수 상위 지역 다섯 칸과 `그 외 지역` 한 칸을 2열로 배치한다

import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";
import type { RegionCount } from "../search";

const TILE =
  "flex flex-col gap-1 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Tailwind는 런타임 값으로 클래스를 만들 수 없다. 12단계 고정 목록에서 고른다
const BAR_WIDTHS = [
  "w-1/12",
  "w-2/12",
  "w-3/12",
  "w-4/12",
  "w-5/12",
  "w-6/12",
  "w-7/12",
  "w-8/12",
  "w-9/12",
  "w-10/12",
  "w-11/12",
  "w-full",
] as const;

/** 건수를 최댓값 대비 12단계로 올림한다. 올림이라 1건도 눈에 보이고 순서가 뒤집히지 않는다 */
function barWidth(count: number, max: number): string {
  const step = Math.min(12, Math.max(1, Math.ceil((count / max) * 12)));
  return BAR_WIDTHS[step - 1];
}

interface RegionTilesProps {
  regions: RegionCount[];
  /** 타일에 걸리지 않은 나머지 교회 수 */
  restCount: number;
}

export function RegionTiles({ regions, restCount }: RegionTilesProps) {
  const tiles = [
    ...regions.map(({ region, count }) => ({
      label: region,
      count,
      href: `/churches?region=${encodeURIComponent(region)}`,
    })),
    { label: "그 외 지역", count: restCount, href: "/churches" },
  ];
  const max = Math.max(...tiles.map((tile) => tile.count));

  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map(({ label, count, href }) => (
        <Link
          key={label}
          href={href}
          transitionTypes={NAV_FORWARD}
          className={TILE}
        >
          <span className="text-t5 font-semibold text-foreground">{label}</span>
          <span className="text-t4 text-muted-foreground">{count}곳</span>
          {/* 건수는 바로 위에 숫자로 있으므로 막대는 장식이다 */}
          <span
            aria-hidden
            className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-border"
          >
            <span
              className={cn(
                "block h-full rounded-full bg-muted-foreground",
                barWidth(count, max),
              )}
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
