"use client";
// 교회 목록 화면의 컨테이너 — 검색어·지역 상태를 들고 검색바·지역칩·카드 목록을 조합한다

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Church } from "@/types/church";
import {
  collectDenominationGroups,
  collectRegions,
  filterChurches,
} from "../search";
import { ALL, ChipFilter } from "./ChipFilter";
import { ChurchCard } from "./ChurchCard";
import { ChurchSearchBar } from "./ChurchSearchBar";

// 홈의 지역 타일이 넘기는 `?region=`을 읽는다.
// 서버에서 searchParams를 받으면 라우트가 Dynamic이 되고, useSearchParams()를 쓰면
// Suspense 경계가 필요해져 교회 목록이 정적 HTML에서 빠진다. 둘 다 피하려고
// URL을 외부 저장소로 취급한다 — 서버 스냅샷이 비어 있어 하이드레이션도 어긋나지 않는다.
const subscribeToNothing = () => () => {};
const readRegionFromUrl = () =>
  new URLSearchParams(window.location.search).get("region") ?? "";
const noRegionOnServer = () => "";

export function ChurchDirectory({ churches }: { churches: Church[] }) {
  const [query, setQuery] = useState("");
  const regions = useMemo(() => collectRegions(churches), [churches]);
  const groups = useMemo(() => collectDenominationGroups(churches), [churches]);

  const urlRegion = useSyncExternalStore(
    subscribeToNothing,
    readRegionFromUrl,
    noRegionOnServer,
  );
  // 칩을 한 번이라도 누르면 그때부터는 URL을 보지 않는다 (초기값 전용)
  const [picked, setPicked] = useState<string | null>(null);
  const region = picked ?? (regions.includes(urlRegion) ? urlRegion : ALL);

  // 교단은 URL로 들어오는 경로가 없어 지역 같은 초기값 처리가 필요 없다
  const [group, setGroup] = useState(ALL);

  const results = useMemo(
    () =>
      filterChurches(churches, {
        q: query,
        region: region === ALL ? undefined : region,
        denominationGroup: group === ALL ? undefined : group,
      }),
    [churches, query, region, group],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChurchSearchBar value={query} onChange={setQuery} />

      {/* 두 줄을 한 덩어리로 붙여 검색바·목록과 구분한다 */}
      <div className="flex flex-col gap-2">
        <ChipFilter
          label="지역"
          tone="neutral"
          options={regions}
          selected={region}
          onSelect={setPicked}
        />
        <ChipFilter
          label="교단"
          tone="brand"
          options={groups}
          selected={group}
          onSelect={setGroup}
        />
      </div>

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
