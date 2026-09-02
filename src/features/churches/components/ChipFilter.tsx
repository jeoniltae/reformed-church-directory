"use client";
// 필터 칩 한 줄 — 좌측 고정 라벨 + 가로 스크롤 칩. 지역·교단 필터가 함께 쓴다
//
// 원래 RegionFilter 하나였는데 교단 필터가 생기면서 두 벌이 됐다. 스크롤 보정처럼
// 한 번 밟은 함정이 있는 코드라 두 곳에 복사하면 한쪽만 고치게 된다.

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 아무것도 거르지 않는 상태. 칩 목록의 첫 항목이자 기본값이다 */
export const ALL = "전체";

/**
 * 미선택 칩의 색.
 *
 * 두 줄이 나란히 놓이면 회색이 겹쳐 같은 줄처럼 읽힌다. 그렇다고 새 색을
 * 들이면 토큰 어휘가 두 벌이 된다 — `--secondary`·`--muted`·`--accent`는
 * 값이 모두 `oklch(0.97 0 0)`으로 같아서 애초에 고를 다른 회색도 없다.
 *
 * 그래서 **브랜드 네이비의 옅은 톤**을 쓴다. 새 토큰이 없고 색 가족이 브랜드와
 * 같아 팔레트가 늘어나 보이지 않는다. 선택되면 같은 네이비가 진해지므로
 * `옅은 네이비 → 진한 네이비`로 강조가 이어진다(회색에서 네이비로 건너뛰지 않는다).
 */
const UNSELECTED_TONE = {
  neutral: "",
  brand: "bg-primary/10 text-primary hover:bg-primary/20",
} as const;

interface ChipFilterProps {
  /**
   * 줄 왼쪽에 보이는 이름. 접근성 이름도 겸한다.
   *
   * **두 줄이 나란히 놓이면 라벨 없이는 같은 줄이 반복된 것처럼 읽힌다.**
   * 칩에 `전체 지역`처럼 대상을 적어 넣는 방법도 있었으나, 그러면 정보가
   * 첫 칩에만 있고 스크롤하면 사라진다. 라벨은 고정이라 항상 남는다.
   */
  label: string;
  /** 미선택 칩의 색. 두 줄이 겹쳐 보이지 않게 줄마다 다르게 준다 */
  tone: keyof typeof UNSELECTED_TONE;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export function ChipFilter({
  label,
  tone,
  options,
  selected,
  onSelect,
}: ChipFilterProps) {
  return (
    <div className="flex items-start gap-3">
      {/*
        leading-9로 칩 높이(h-9)에 맞춰 첫 줄과 나란히 놓는다.
        넓은 화면에서 칩이 여러 줄로 접히면 라벨은 첫 줄에 남는다.
      */}
      <span className="w-7 shrink-0 text-t2 leading-9 text-muted-foreground">
        {label}
      </span>

      {/*
        모바일에서는 가로 스크롤, 넓어지면 줄바꿈으로 푼다 — 교단 6개는
        데스크톱에서 한 줄에 다 들어가는데 굳이 스크롤 영역에 가둘 이유가 없다.
        오른쪽 끝까지 흐르도록 -mr-4로 화면 여백을 넘긴다.
      */}
      <div
        role="group"
        aria-label={`${label} 필터`}
        className="no-scrollbar scroll-fade -mr-4 flex gap-2 overflow-x-auto pr-4 sm:mr-0 sm:flex-wrap sm:gap-y-2 sm:overflow-x-visible sm:pr-0"
      >
        {[ALL, ...options].map((option) => (
          <Button
            key={option}
            type="button"
            variant={option === selected ? "default" : "secondary"}
            aria-pressed={option === selected}
            onClick={(event) => {
              onSelect(option);
              // 목록 끝의 칩을 눌러도 잘리지 않도록 누른 칩을 가운데로 끌어온다.
              // block: nearest가 없으면 세로 스크롤까지 함께 움직인다
              event.currentTarget.scrollIntoView({
                behavior: "smooth",
                inline: "center",
                block: "nearest",
              });
            }}
            className={cn(
              "h-9 shrink-0 px-3 text-t4",
              option !== selected && UNSELECTED_TONE[tone],
            )}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
