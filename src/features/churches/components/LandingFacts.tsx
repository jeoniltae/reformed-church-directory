// 랜딩 상단의 수록 현황 블록 — 큰 건수 + 라벨-값 분포. 지역·교단 랜딩이 함께 쓴다
//
// **회색 두 줄 → 라벨 열 → 지금 모양으로 두 번 고쳤다 (2026-09-18·19).** 라벨 열까지
// 세우고 나서도 **이 블록만 화면에서 맨 텍스트 세 줄**이었다. 같은 화면 아래
// `ChurchCard`는 원형 이니셜 타일·교회명 t6·배지·아이콘 둘·면을 쓰는데,
// **정작 먼저 읽혀야 할 요약이 14px로 목록보다 작았다** — 위계가 뒤집혀 있었다.

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { FacetLine } from "../landing";

export interface LandingFact {
  label: string;
  value: FacetLine;
  /**
   * 라벨을 청록(`--brand-accent`)으로 칠한다 — **지역을 가리키는 줄(`지역`·`시군구`)에만.**
   * `교단` 줄에 주면 "지역"을 뜻하는 색이 다른 뜻으로 쓰인다. **라벨만이고 값은
   * 본문색 그대로다** — 값까지 칠하면 읽는 글자가 강세색이 되어 위계가 뒤집힌다.
   */
  accent?: boolean;
}

/**
 * ⚠️ **라벨 열 폭을 고정값으로 주지 않는다.** `grid-cols-[auto_1fr]`이라 **가장 긴
 * 라벨**이 폭을 정하고 나머지가 거기 맞춘다. `w-16` 같은 값을 박으면 라벨이 하나
 * 늘 때마다 손으로 다시 재야 한다.
 *
 * **라벨은 오른쪽 정렬이다.** `교단`·`시군구`는 글자 수가 달라서 왼쪽으로 붙이면
 * **끝이 들쭉날쭉해 정렬이 반만 산다.** 오른쪽으로 몰면 라벨 끝과 값 시작이 하나의
 * 홈통이 되어 두 줄이 같은 세로선에서 시작한다.
 *
 * ## 색은 굵기로 갈고 회색은 꼬리에만 남긴다 (2026-09-19, 2차)
 *
 * 처음에는 **라벨을 t2 `muted`로, 값 안의 건수·쉼표도 `muted`로** 두어 이름만
 * 떠오르게 했다. **너무 흐렸다** — `--muted-foreground`는 흰 배경에서 **4.73:1**로
 * 본문 기준(4.5:1)을 겨우 넘는 값이라 **12px에서는 읽으려면 눈을 모아야 한다.**
 *
 * 그래서 **색이 아니라 굵기로 층을 만든다.** 라벨 semibold · 이름 medium · 건수와
 * 쉼표 regular로, **넷 중 셋이 `foreground`(19.8:1)다.**
 *
 * - **라벨을 t2에서 t4로 올렸다.** `/about`의 용어 정리가 쓰는 어휘와 같다 — 거기서도
 *   항목 이름이 굵은 `foreground`이고 곁말이 `muted`다.
 * - ⚠️ **`외 3종`만 `muted`로 남긴다.** 그것은 데이터가 아니라 **"숨긴 것이 있다"는
 *   메타**다. 여기까지 진하게 하면 안 보여주는 것이 보여주는 것만큼 주장하게 된다.
 *
 * ⚠️ **면(`bg-card`)을 주지 않는다.** 아래 `ChurchCard`와 같은 층이 되어 **요약이
 * 첫 번째 카드처럼 보인다.** 위아래 실선 두 개까지가 상한이다 — `RegionTiles`의
 * "선이 많으면 내용보다 격자가 먼저 읽힌다"에서 아직 안전한 양이다.
 */
export function LandingFacts({
  count,
  facts,
}: {
  count: number;
  facts: LandingFact[];
}) {
  const rows = facts.filter(({ value }) => value.items.length > 0);

  return (
    <div className="mt-4 border-y border-border py-4">
      {/*
        **건수를 헤드라인으로 올렸다.** 홈 다크 카드의 어휘 그대로다 — 큰 숫자 +
        작은 단위(`수록 교회 / 29곳`). h1(t8) 다음이 t9라 낙차가 생기고, `수록`
        라벨이 빠져 아래 라벨 열도 한 글자 좁아졌다.

        **`tabular-nums`다.** 지역마다 자릿수가 1~2로 달라(3곳 ~ 29곳) 붙이지 않으면
        랜딩을 옮겨 다닐 때 숫자 폭이 흔들린다.
      */}
      <p className="flex items-baseline gap-1">
        <span className="text-t9 font-bold tabular-nums text-foreground">
          {/* 라벨을 없애면서 스크린리더가 맥락 없이 숫자만 읽게 됐다. 홈 h1의 롤링을
              감출 때 쓴 것과 같은 수법으로 `수록`을 소리로만 돌려준다 */}
          <span className="sr-only">수록 </span>
          {count}
        </span>
        <span className="text-t5 text-muted-foreground">곳</span>
      </p>

      {rows.length > 0 && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2.5">
          {rows.map(({ label, value, accent }) => (
            <Fragment key={label}>
              <dt
                className={cn(
                  "text-right text-t4 font-semibold",
                  accent ? "text-brand-accent" : "text-foreground",
                )}
              >
                {label}
              </dt>
              <dd className="text-t4 text-foreground">
                {value.items.map(({ name, count: itemCount }, index) => (
                  <Fragment key={name}>
                    {index > 0 && ", "}
                    <span className="font-medium">{name}</span>
                    {itemCount && (
                      <span className="tabular-nums"> {itemCount}</span>
                    )}
                  </Fragment>
                ))}
                {value.rest && (
                  <span className="text-muted-foreground"> {value.rest}</span>
                )}
              </dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}
