"use client";
// 지도 탭의 본문 — 전국 지도와 교회 목록을 한 화면에서 오간다
//
// ⚠️ **전환 상태를 URL에 넣지 않는다.** `/churches?region=`을 초기값 전용으로 둔 결정과
// 같은 이유다(`CLAUDE.md` "상태 관리") — `searchParams`를 받으면 라우트가 Dynamic이 되어
// 탭 전환마다 서버 왕복이 생기고, `useSearchParams()`는 Suspense 경계를 요구해
// **교회 목록이 정적 HTML에서 빠진다.**

import { LayoutListIcon, MapIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NAV_BACK, NAV_FORWARD } from "@/components/shared/PageTransition";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";
import { hasCoords } from "../map/points";
import { ChurchCard } from "./ChurchCard";
import { ChurchMap } from "./ChurchMap";

type View = "map" | "list";

// `Map`은 전역 `Map`과 이름이 겹쳐 읽기 어렵다 — lucide가 주는 별칭을 쓴다
const VIEWS = [
  { value: "map", label: "지도", Icon: MapIcon },
  { value: "list", label: "목록", Icon: LayoutListIcon },
] as const;

/**
 * 안내 줄에 이름을 적을 최대 교회 수.
 *
 * 지금은 좌표 없는 교회가 1곳이라 이름이 그대로 보인다. **고신 2,118건이 들어오면
 * 수십 곳이 될 수 있어** 그때 이 줄이 문단이 되지 않도록 상한을 둔다.
 */
const NAMED_LIMIT = 3;

export function ChurchMapView({ churches }: { churches: Church[] }) {
  const [view, setView] = useState<View>("map");

  /**
   * 좌표가 없어 지도에서 빠지는 교회.
   *
   * ⚠️ **이 교회들을 화면에서 지우지 않는 것이 이 줄의 목적이다.** 지도만 있는
   * 화면에서는 **존재 자체가 사라져** 우리가 가진 사실과 화면이 어긋난다.
   * `목록` 보기에는 그대로 들어 있다.
   */
  const missing = useMemo(
    () => churches.filter((church) => !hasCoords(church)),
    [churches],
  );
  const named = missing.slice(0, NAMED_LIMIT);

  return (
    <div className="flex flex-col gap-3">
      {/* 칩 필터와 같은 어휘다 — 고른 것은 진한 네이비, 나머지는 회색 */}
      <div role="group" aria-label="보기 방식" className="flex gap-2">
        {VIEWS.map(({ value, label, Icon }) => (
          <Button
            key={value}
            type="button"
            variant={view === value ? "default" : "secondary"}
            aria-pressed={view === value}
            onClick={() => setView(value)}
            className="h-9 px-3 text-t4"
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </Button>
        ))}
      </div>

      {/*
        ⚠️ **지도는 숨기지 않고 떼어낸다.** 목록으로 갔다가 돌아오면 `display: none`
        동안 컨테이너가 0×0이라 **타일이 어긋난 채로 되살아난다.** 다시 만드는 편이
        간단하고, SDK는 이미 받아 뒀으므로(로더가 Promise를 캐시한다) 비용도 거의 없다.
        **대신 되돌아오면 시야가 전국으로 초기화된다** — 확대해 둔 자리는 남지 않는다.
      */}
      {view === "map" && (
        <div>
          {/* 지도가 이 화면의 주인공이라 조작을 강제로 켠다(`interactive`) */}
          <ChurchMap
            churches={churches}
            interactive
            linkToDetail
            className="h-[70svh] w-full"
          />

          {missing.length > 0 && (
            <p className="mt-3 text-t2 text-muted-foreground">
              좌표를 확인하지 못해{" "}
              <strong className="font-semibold text-foreground">
                지도에 표시되지 않는 교회 {missing.length}곳
              </strong>
              이 있습니다 —{" "}
              {named.map((church, index) => (
                <span key={church.id}>
                  {index > 0 && ", "}
                  <Link
                    href={`/churches/${church.id}`}
                    transitionTypes={NAV_FORWARD}
                    className="rounded-lg text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {church.name}
                  </Link>
                </span>
              ))}
              {missing.length > named.length &&
                ` 외 ${missing.length - named.length}곳`}
              . 목록 보기에는 그대로 있습니다.
            </p>
          )}
        </div>
      )}

      {/*
        ⚠️ **목록은 `hidden`으로 덮을 뿐 DOM에서 빼지 않는다.** 지도를 떼어내는 것과
        반대인데, 이유는 **정적 HTML**이다 — 지도는 글자를 남기지 않으므로, 목록까지
        빠지면 이 화면의 HTML에 교회 이름이 한 글자도 없게 된다. `/churches`가 20건
        너머를 `hidden`으로 접어 둔 것과 같은 판단이다(색인이 링크를 전부 본다).
      */}
      <ul
        className={cn("flex flex-col gap-2", view !== "list" && "hidden")}
        aria-hidden={view !== "list"}
      >
        {churches.map((church) => (
          <li key={church.id}>
            <ChurchCard church={church} />
          </li>
        ))}
      </ul>

      {view === "list" && (
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          <p className="text-t4 text-muted-foreground">
            지역·교단으로 좁혀 찾으시려면 교회 찾기를 이용해 주세요.
          </p>
          {/* 지도(2) → 검색(1)이라 왼쪽으로 되돌아간다 */}
          <Link
            href="/churches"
            transitionTypes={NAV_BACK}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "text-t4",
            )}
          >
            교회 찾기로 가기
          </Link>
        </div>
      )}
    </div>
  );
}
