// 교단 허브의 교회 링크 줄 — 총회 하나에 딸린 교회 1~4곳을 한 줄로 잇는다
//
// **랜딩이 없는 총회의 교회로 가는 유일한 길이다.** 그래서 카드가 아니라 링크다 —
// 목록이 짧고, 이 절의 주인공은 교회가 아니라 총회다.

import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import type { Church } from "@/types/church";

/**
 * **이름 가나다로 다시 정렬한다.** `getAllChurches()`는 지역 → 시군구 → 이름 순인데
 * 여기서는 지역을 묶어 보여주지 않으므로 그 순서가 화면에서 설명되지 않는다.
 * *"설명할 수 없는 순서는 사용자 눈에 추천순으로 읽힌다"*는 것이 이 프로젝트가
 * 목록 정렬 기준을 세운 이유다(`features/churches/data.ts`).
 */
const collator = new Intl.Collator("ko");

export function ChurchLinks({ churches }: { churches: Church[] }) {
  const sorted = [...churches].sort((a, b) => collator.compare(a.name, b.name));

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {sorted.map((church) => (
        <li key={church.id}>
          <Link
            href={`/churches/${church.id}`}
            transitionTypes={NAV_FORWARD}
            className="rounded text-foreground underline underline-offset-4 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {church.name}
          </Link>
          {/*
            **시도를 덧붙여 동명 교회를 가른다.** `언약교회`가 셋(합신 경기·개혁회 대구·
            울산)이라 이름만 두면 화면에서 구분되지 않는다 — 판정표도 그 행에
            `동명 교회 주의`를 적어 뒀다. 링크 밖에 두는 것은 링크 텍스트를
            교회명 그대로 유지하기 위해서다.
          */}
          <span className="ml-1 text-muted-foreground">{church.region}</span>
        </li>
      ))}
    </ul>
  );
}
