// 홈의 지역 타일 — 건수 상위 지역 다섯 칸과 `그 외 지역` 한 칸을 2열로 배치한다

import Link from "next/link";
import type { RegionCount } from "../search";

const TILE =
  "flex flex-col gap-1 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

interface RegionTilesProps {
  regions: RegionCount[];
  /** 타일에 걸리지 않은 나머지 교회 수 */
  restCount: number;
}

export function RegionTiles({ regions, restCount }: RegionTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {regions.map(({ region, count }) => (
        <Link
          key={region}
          href={`/churches?region=${encodeURIComponent(region)}`}
          className={TILE}
        >
          <span className="text-t5 font-semibold text-foreground">{region}</span>
          <span className="text-t4 text-muted-foreground">{count}곳</span>
        </Link>
      ))}
      <Link href="/churches" className={TILE}>
        <span className="text-t5 font-semibold text-foreground">그 외 지역</span>
        <span className="text-t4 text-muted-foreground">{restCount}곳</span>
      </Link>
    </div>
  );
}
