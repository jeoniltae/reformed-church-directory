// 홈의 지역 칩 — 수록된 시도를 표준 순서로 세우고, 아직 없는 곳은 아래 한 줄로 밝힌다
//
// **타일에서 칩으로 바꿨다 (2026-09-12).** 예전에는 건수 상위 5곳 + `그 외 지역`
// 여섯 칸이었다. 16곳 전부를 보여주기로 하면서 지금 타일(91px)로는 2열 8행 =
// **784px**, 375×800 화면의 **98%**가 된다. 칩으로 낮추면 예전 여섯 칸과 거의 같은
// 세로에 전국이 들어간다.
//
// ⚠️ **가로 스와이프를 쓰지 않는다.** 세로는 가장 아끼지만 한 화면에 3칸만 보여
// **16곳 중 13곳이 숨는다.** `/churches`의 가로 칩은 *이미 목록을 보고 있는* 상태의
// 보조 필터라 괜찮지만, **여기는 "어디서 시작할지" 고르는 1차 진입점**이다.
// 선택지의 80%를 감추는 것은 그 역할과 반대다.
//
// ⚠️ **건수 막대를 없앴다.** 막대는 최댓값 대비 비율이라 **지역의 서열을 그리는
// 장치**다. 제주 0·경남 1이 들어오면 대부분이 실오라기가 되기도 한다. 숫자가 바로
// 옆에 있으므로 정보가 줄지 않는다.
//
// ## 면으로 바꿨다 (2026-09-12, 2차)
//
// ⚠️ **`/churches`의 지역 칩과 같은 표면이어야 한다.** 둘은 **"지역을 고른다"는
// 똑같은 조작**이다 — 홈에서 `경남`을 누르면 `/churches`로 넘어가 같은 이름의 칩이
// 선택된 상태로 나온다. 그런데 홈은 `border` + `bg-card`, 저쪽은 `bg-secondary`라
// **"내가 누른 그것"으로 읽히지 않았다.** 저쪽 어휘에 맞춰 테두리를 걷어냈다.
//
// **테두리 16개가 홈에서 가장 큰 시각적 잡음이었다.** 사방 테두리를 두른 칸이
// 열여섯이라 화면이 표(spreadsheet)처럼 보였다. `/churches`의 필터 줄 스크롤바를
// 감춘 것과 같은 판단이다 — 선이 많으면 내용보다 격자가 먼저 읽힌다.

import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { LANDING_MIN } from "../landing";

/**
 * 칩 한 칸 — **채운 사각형이 아니라 밑줄이다** (2026-09-12, 4차 확정).
 *
 * ## 왜 면을 버렸나
 *
 * 채움의 색을 세 번 바꿨다(흰 카드+테두리 → 회색 → 옅은 네이비). 전부 맞지 않았는데
 * **원인이 색이 아니라 면이었다.** 채운 칸 열다섯이 홈 한가운데를 덩어리로 차지한다 —
 * 무슨 색을 넣든 그 무게는 그대로다. 네 안(선 구분·숫자 강조·밑줄·면)을 나란히
 * 그려 비교한 뒤 밑줄로 정했다.
 *
 * - **가볍다.** 면이 사라지니 열다섯이 더 이상 덩어리로 안 보인다.
 * - **눌러진다는 신호가 남는다.** 면도 테두리도 없애면 그냥 글자로 보일 위험이 있는데,
 *   밑줄은 탭·링크의 관용구다. 선 구분(`border-b border-border`)만으로는 이게 약했다.
 * - **h1의 지역 롤링과 색이 이어진다.** 바로 위에서 `오늘, ○○에서`가 청록으로 굴러가고
 *   그 아래 지역 칸도 청록이면 **"지역 = 청록"**이라는 어휘가 생긴다.
 *
 * ⚠️ **청록을 면으로 채우지 말 것.** 3차에서 청록을 후보에서 뺀 이유가
 * **"칸 열다섯을 청록 면으로 채우면 강세색이 브랜드색(네이비)을 넘어선다"**였다.
 * 밑줄은 면이 아니라 선이라 같은 색인데 양이 1/20이고, 그래서 그 문제가 없다.
 *
 * ⚠️ **숫자를 `text-muted-foreground`로 되돌리지 말 것.** 회색 면 시절 `곳` 숫자가
 * **4.35:1로 본문 기준(4.5:1)에 미달**했다(실측). 흰 바탕 위 청록은 **5.83:1**이다.
 *
 * **`rounded-t-md`는 hover·active 배경을 위한 것이다.** 위만 둥글고 아래는 각져
 * 밑줄과 맞물리므로 탭처럼 읽힌다. 터치에는 hover가 없어 `active:`가 필요하다.
 *
 * ⚠️ **세로 여백을 줄이지 말 것.** `pt-3`(12) + 줄높이(22) + `pb-2.5`(10) + 밑줄(2)
 * = **46px**으로, 이 프로젝트가 지켜온 터치 최소 44px을 넘긴다
 * (`ScrollToTop`이 같은 기준으로 `size-11`을 쓴다).
 */
const CHIP =
  "flex items-baseline justify-between gap-1 rounded-t-md border-b-2 border-brand-accent px-1 pt-3 pb-2.5 outline-none transition-colors hover:bg-brand-accent/5 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-brand-accent/10";

export interface RegionChip {
  region: string;
  count: number;
}

export function RegionTiles({ regions }: { regions: RegionChip[] }) {
  /*
    ⚠️ **수록 0인 지역은 격자에서 뺀다.** 칸으로 두면 링크와 크기·모양이 같아
    **눌러보게 되는데 눌러야 빈 목록**이다. 그리고 16칸은 3열에서 `3×5 + 1`이라
    마지막 줄에 한 칸만 남아 격자가 깨져 보였다. 빼면 15 = 3×5로 딱 맞는다.

    **대신 아래 한 줄로 반드시 밝힌다.** 목록에서 통째로 지우면 "빠뜨린 건지 아직
    없는 건지"를 구분할 수 없게 된다 — 전국을 세워 둔 이유가 사라진다.
    수록이 생기면 **저절로 격자로 올라온다.**
  */
  const listed = regions.filter(({ count }) => count > 0);
  const empty = regions.filter(({ count }) => count === 0);

  return (
    <>
      {/*
        **3열이 하한이다.** 375px에서 칩 폭이 109px인데, 가장 긴 `전남광주`가
        4글자라 여기까지가 한 줄에 들어간다. 4열(80px)로 줄이면 넘친다.
      */}
      <div className="grid grid-cols-3 gap-2">
        {listed.map(({ region, count }) => (
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
            className={CHIP}
          >
            <span className="truncate text-t5 font-semibold text-foreground">
              {region}
            </span>
            {/*
              숫자에 청록이 든다 — 밑줄과 한 쌍으로 읽혀 강세가 한 덩어리가 된다.
              `곳`을 붙이는 것은 숫자만 두면 무엇의 수인지 맥락에 기대기 때문이고,
              `tabular-nums`라 29·4·1이 섞여도 자릿수가 흔들리지 않는다.
            */}
            <span className="shrink-0 text-t4 font-semibold tabular-nums text-brand-accent">
              {count}곳
            </span>
          </Link>
        ))}
      </div>

      {empty.length > 0 && (
        <p className="mt-3 text-t4 text-muted-foreground">
          아직 수록되지 않은 지역 · {empty.map(({ region }) => region).join(" · ")}
        </p>
      )}
    </>
  );
}
