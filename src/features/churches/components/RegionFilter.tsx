"use client";
// 지역 필터 칩 — 가로 스크롤 한 줄, `전체`가 맨 앞에 온다

import { Button } from "@/components/ui/button";

export const ALL_REGIONS = "전체";

interface RegionFilterProps {
  regions: string[];
  selected: string;
  onSelect: (region: string) => void;
}

export function RegionFilter({
  regions,
  selected,
  onSelect,
}: RegionFilterProps) {
  return (
    <div
      role="group"
      aria-label="지역 필터"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
    >
      {[ALL_REGIONS, ...regions].map((region) => (
        <Button
          key={region}
          type="button"
          variant={region === selected ? "default" : "secondary"}
          aria-pressed={region === selected}
          onClick={() => onSelect(region)}
          className="h-9 shrink-0 px-3 text-t4"
        >
          {region}
        </Button>
      ))}
    </div>
  );
}
