// 교단 허브의 교회 칩 — 총회 하나에 딸린 교회 1~4곳을 칩으로 잇는다
//
// **랜딩이 없는 총회의 교회로 가는 유일한 길이다.** 그래서 목록이 아니라 링크다 —
// 짧고, 이 절의 주인공은 교회가 아니라 총회다.
//
// ## 밑줄 링크에서 칩으로 바꿨다 (2026-09-19)
//
// **이름과 지역이 붙어 읽혔다.** `영화교회`(검정 밑줄) + `서울`(회색)이 한 덩어리인데
// 항목 사이 간격이 12px뿐이라, 이름과 지역 사이(4px)와 차이가 작아
// **`…복용교회 대전 명륜교회 서울…`으로 뭉쳤다.** 구분자도 면도 없었다.
//
// ⚠️ **밑줄이 총회명을 이겼다.** 링크가 `밑줄 + foreground`인데 총회명은
// `t5 semibold + foreground`다. **밑줄은 이 사이트에서 가장 강한 눌림 신호**라
// (지역 칩도 밑줄로 그것을 표시한다) 링크 15개가 제목 8개보다 먼저 읽혔다.
// 면으로 바꾸면 덩어리 경계가 생기고 밑줄이 빠져 제목이 제자리를 찾는다.
//
// **여기서는 칩을 써도 된다.** `RegionTiles`가 시군구를 칩으로 만들지 말라고 한 이유는
// **"눌러도 갈 곳이 없어서"**였는데, 이 칩은 실제로 교회 상세로 간다.

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

/**
 * 칩 한 칸.
 *
 * **높이 35px은 `/churches`의 필터 칩(`h-9`)과 같은 단이다.** 지역 랜딩의 교단
 * 칩(`py-1.5`, 31px)이 아니라 이쪽을 따른 것은 **저기는 훑어보는 메타이고 여기는
 * 눌러서 나가는 길**이기 때문이다. 새 치수를 만들지는 않았다.
 *
 * **hover가 브랜드 네이비 틴트다** — `ChipFilter`의 `UNSELECTED_TONE.brand`와 같은
 * 값(`bg-primary/10 text-primary`)이라 "눌리는 칩"의 어휘가 화면마다 같아진다.
 */
const CHIP =
  "inline-flex items-baseline gap-1.5 rounded-lg bg-muted px-3 py-2 text-foreground outline-none transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px";

export function ChurchLinks({ churches }: { churches: Church[] }) {
  const sorted = [...churches].sort((a, b) => collator.compare(a.name, b.name));

  return (
    <ul className="flex flex-wrap gap-2">
      {sorted.map((church) => (
        <li key={church.id}>
          <Link
            href={`/churches/${church.id}`}
            transitionTypes={NAV_FORWARD}
            className={CHIP}
          >
            {/* 색을 주지 않는다 — 칩(링크)의 색을 물려받아야 hover에서 함께 네이비가 된다 */}
            <span className="text-t4 font-medium">{church.name}</span>
            {/*
              **시도를 덧붙여 동명 교회를 가른다.** `언약교회`가 셋(합신 경기·개혁회
              대구·울산)이라 이름만 두면 화면에서 구분되지 않는다 — 판정표도 그 행에
              `동명 교회 주의`를 적어 뒀다.

              **예전에는 링크 밖에 뒀다.** 링크 텍스트를 교회명 그대로 두려던 것인데,
              칩이 곧 링크가 되면서 안으로 들어왔다. **이쪽이 낫다** — 스크린리더로
              링크만 훑으면 예전에는 `언약교회, 언약교회, 언약교회`로 들렸다.
            */}
            <span className="text-t2 text-muted-foreground">
              {church.region}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
