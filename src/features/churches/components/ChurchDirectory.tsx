"use client";
// 교회 목록 화면의 컨테이너 — 검색어·지역 상태를 들고 검색바·지역칩·카드 목록을 조합한다

import { useMemo, useState } from "react";
import type { Church } from "@/types/church";
import { collectRegions, filterChurches } from "../search";
import { ChurchCard } from "./ChurchCard";
import { ChurchSearchBar } from "./ChurchSearchBar";
import { ALL_REGIONS, RegionFilter } from "./RegionFilter";

interface ChurchDirectoryProps {
  churches: Church[];
  /** 홈의 지역 타일에서 넘어온 초기 선택값. 이후 변경은 로컬 상태로만 관리한다 */
  initialRegion?: string;
}

export function ChurchDirectory({
  churches,
  initialRegion,
}: ChurchDirectoryProps) {
  const [query, setQuery] = useState("");
  const regions = useMemo(() => collectRegions(churches), [churches]);
  // 데이터에 없는 지역이 URL로 들어오면 빈 목록이 되므로 `전체`로 되돌린다
  const [region, setRegion] = useState(() =>
    initialRegion && regions.includes(initialRegion) ? initialRegion : ALL_REGIONS,
  );
  const results = useMemo(
    () =>
      filterChurches(churches, {
        q: query,
        region: region === ALL_REGIONS ? undefined : region,
      }),
    [churches, query, region],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChurchSearchBar value={query} onChange={setQuery} />
      <RegionFilter regions={regions} selected={region} onSelect={setRegion} />

      {results.length === 0 ? (
        <p className="py-12 text-center text-t4 text-muted-foreground">
          조건에 맞는 교회가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((church) => (
            <li key={church.id}>
              <ChurchCard church={church} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
