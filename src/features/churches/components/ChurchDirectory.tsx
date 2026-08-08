"use client";
// 교회 목록 화면의 컨테이너 — 검색어·지역 상태를 들고 검색바·지역칩·카드 목록을 조합한다

import { useMemo, useState } from "react";
import type { Church } from "@/types/church";
import { collectRegions, filterChurches } from "../search";
import { ChurchCard } from "./ChurchCard";
import { ChurchSearchBar } from "./ChurchSearchBar";
import { ALL_REGIONS, RegionFilter } from "./RegionFilter";

export function ChurchDirectory({ churches }: { churches: Church[] }) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(ALL_REGIONS);

  const regions = useMemo(() => collectRegions(churches), [churches]);
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
