// 홈의 지역 칩 — 시도 16곳을 표준 순서로 세우고, 수록 교회가 없는 곳은 0으로 남긴다
//
// **타일에서 칩으로 바꿨다 (2026-09-12).** 예전에는 건수 상위 5곳 + `그 외 지역`
// 여섯 칸이었다. 16곳 전부를 보여주기로 하면서 지금 타일(91px)로는 2열 8행 =
// **784px**, 375×800 화면의 **98%**가 된다. 칩으로 낮추면 3열 6행 = 292px으로
// **예전 여섯 칸(289px)과 거의 같은 세로에 16곳 전부**가 들어간다.
//
// ⚠️ **가로 스와이프를 쓰지 않는다.** 세로는 가장 아끼지만 한 화면에 3칸만 보여
// **16곳 중 13곳이 숨는다.** `/churches`의 가로 칩은 *이미 목록을 보고 있는* 상태의
// 보조 필터라 괜찮지만, **여기는 "어디서 시작할지" 고르는 1차 진입점**이다.
// 선택지의 80%를 감추는 것은 그 역할과 반대다. 데스크톱에서 가로 스크롤이 어색한
// 것도 걸린다.
//
// ⚠️ **건수 막대를 없앴다.** 막대는 최댓값 대비 비율이라 **지역의 서열을 그리는
// 장치**다. `/about`에 `노출 순서에 어떤 평가도 반영하지 않습니다`를 적어 둔 것과
// 어긋나고, 제주 0·경남 1이 들어오면 대부분이 실오라기가 된다. 숫자가 바로 옆에
// 있으므로 정보가 줄지도 않는다.

import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";
import { LANDING_MIN } from "../landing";

/**
 * 칩 공통 모양. 링크와 비링크가 **같은 크기**여야 격자가 흔들리지 않는다.
 * 표면은 예전 타일과 같은 어휘다(`border` + `bg-card`).
 */
const CHIP =
  "flex items-baseline justify-between gap-1 rounded-lg border border-border px-2.5 py-2.5";

/** 누름 상태는 `ChurchCard`·`ChurchRow`와 같은 어휘다 — 터치에는 hover가 없다 */
const CHIP_LINK =
  "bg-card outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:bg-muted";

export interface RegionChip {
  region: string;
  count: number;
}

export function RegionTiles({ regions }: { regions: RegionChip[] }) {
  return (
    /*
      **3열이 하한이다.** 375px에서 칩 폭이 109px인데, 가장 긴 `전남광주`가
      4글자라 여기까지가 한 줄에 들어간다. 4열(80px)로 줄이면 넘친다.
    */
    <div className="grid grid-cols-3 gap-2">
      {regions.map(({ region, count }) => {
        const label = (
          <>
            <span className="truncate text-t5 font-semibold">{region}</span>
            <span className="shrink-0 text-t4 tabular-nums text-muted-foreground">
              {count}
            </span>
          </>
        );

        /*
          ⚠️ **0곳은 링크하지 않는다.** 눌러 봐야 빈 목록이라 막다른 길이다.
          흐린 비링크로 두면 **"빠뜨린 것이 아니라 아직 없다"**가 그대로 전달된다.
        */
        if (count === 0) {
          return (
            <span
              key={region}
              className={cn(CHIP, "bg-muted/50 text-muted-foreground")}
            >
              {label}
            </span>
          );
        }

        return (
          <Link
            key={region}
            /*
              랜딩이 있는 지역은 고유 주소로 보낸다 — 크롤러가 따라갈 수 있는 유일한
              길이다. 임계값 미만은 랜딩을 색인 대상으로 만들지 않기로 했으므로
              기존 칩 필터로 보낸다.
            */
            href={
              count >= LANDING_MIN
                ? `/region/${region}`
                : `/churches?region=${encodeURIComponent(region)}`
            }
            transitionTypes={NAV_FORWARD}
            className={cn(CHIP, CHIP_LINK, "text-foreground")}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
