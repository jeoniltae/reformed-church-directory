"use client";
// 교회 목록 화면의 컨테이너 — 검색어·지역 상태를 들고 검색바·지역칩·카드 목록을 조합한다

import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
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
/**
 * 처음에 펼쳐 보일 교회 수.
 *
 * **89건이면 카드 한 장이 110~130px이라 목록이 16화면쯤 된다.** 스크롤을 줄이려고
 * 두는 값이고, 나머지는 `hidden`으로 접었다가 버튼으로 편다.
 */
const INITIAL_VISIBLE = 20;

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

  /**
   * **한 번 펼치면 계속 펼친 상태로 둔다.** 필터를 바꿀 때 접기로 되돌리지 않는다 —
   * "다 보겠다"는 의사표시는 검색어보다 오래 간다. 필터로 결과가 20건 아래로 줄면
   * 어차피 전부 보이므로 되돌릴 이유도 없다.
   */
  const [expanded, setExpanded] = useState(false);

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
        <>
          {/*
            **접는 것이지 잘라내는 것이 아니다.** `slice()`로 20개만 렌더하면 정적
            HTML에서 나머지가 통째로 빠져 무한 스크롤과 같은 SEO 손실이 난다
            (`useSearchParams()`를 피한 것과 같은 이유다). `hidden`은 DOM에 그대로
            두고 화면에만 안 보이게 하므로 **크롤러는 89개 링크를 전부 본다.**
          */}
          <ul className="flex flex-col gap-2">
            {results.map((church, index) => (
              <li
                key={church.id}
                hidden={!expanded && index >= INITIAL_VISIBLE}
              >
                <ChurchCard church={church} />
              </li>
            ))}
          </ul>

          {/*
            무한 스크롤 대신 버튼이다 — 스크롤로 늘어나면 아래 푸터(삭제 요청 창구·
            개인정보 처리방침)에 영영 닿지 못한다. 화면에 brand-solid가 없지만
            여기에 쓰지 않는다. 목록이 주인공이고 이건 보조 동작이다.
          */}
          {!expanded && results.length > INITIAL_VISIBLE && (
            <Button
              variant="outline"
              size="lg"
              className="w-full text-t4"
              onClick={() => setExpanded(true)}
            >
              교회 {results.length - INITIAL_VISIBLE}곳 모두 보기
            </Button>
          )}
        </>
      )}

    </div>
  );
}
