// 교회 데이터 조회 — `data/churches.json`을 읽는 유일한 지점 (서버 전용)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Church } from "@/types/church";

/**
 * 한국어 정렬기. **모듈 스코프에서 한 번만 만든다** — `localeCompare`를 항목마다
 * 호출하면 매번 정렬기를 새로 만드는 셈이라 3천 건에서 눈에 띄게 느려진다.
 *
 * Node 24는 full ICU를 내장하므로 한글 자모 순서가 정확하다. **정렬은 서버에서만
 * 일어난다** — `ChurchDirectory`는 이미 정렬된 배열을 props로 받고 `filterChurches`가
 * 순서를 보존하므로, 브라우저마다 다를 수 있는 collation에 기대지 않는다.
 */
const collator = new Intl.Collator("ko");

/**
 * 목록 순서 — **지역 → 시군구 → 교회명, 전부 가나다** (2026-09-12).
 *
 * ⚠️ **이건 미관이 아니라 `/about`이 한 약속을 지키는 장치다.**
 * `06 이 사이트가 하는 일`에 **"교회의 신앙과 사역을 평가하거나 순위를 매기지
 * 않습니다"**라고 적어 뒀는데, 그 전까지 목록은 원본 CSV 입력 순서였다. 설명할 수
 * 없는 순서는 **사용자 눈에 추천순으로 읽힌다** — 실제로 `/churches` 첫 20건이 전부
 * 서울이었고 홈 미리보기 5건 중 3건이 같은 관악구였다. 우연이지만 그렇게 보였다.
 *
 * **모든 층을 가나다로 두는 것이 핵심이다.** 한 층이라도 건수·중요도로 정렬하면
 * 그 층에 서열이 생기고 위 문장이 거짓이 된다. 가나다는 **사용자가 화면에서 직접
 * 검증할 수 있는** 유일한 기준이기도 하다.
 *
 * **지역 필터를 걸면 자동으로 `시군구 → 교회명`이 된다** — 이 사이트의 주 동선이
 * 지역 기반이라 그대로 맞아떨어진다.
 *
 * ⚠️ **`filterChurches`에서 정렬하지 않는다.** 그쪽은 순수 필터로 두고 여기서만
 * 정렬한다. 옮기면 `search.test.ts`의 순서 단언들이 깨지고, 무엇보다 **같은 일을
 * 두 곳에서 하게 된다** — 필터는 순서를 보존하므로 여기 한 번이면 충분하다.
 *
 * `subRegion`이 없는 2건은 빈 문자열이라 해당 지역 맨 앞에 온다. 결정적이므로
 * 빌드마다 같은 결과가 나온다.
 */
function compareChurches(a: Church, b: Church): number {
  return (
    collator.compare(a.region, b.region) ||
    collator.compare(a.subRegion ?? "", b.subRegion ?? "") ||
    collator.compare(a.name, b.name)
  );
}

/**
 * 모듈 스코프에서 한 번만 읽고 한 번만 정렬한다. 89건이라 전량을 메모리에 들고
 * 있어도 부담이 없고, 3천 건이 되어도 정렬은 프로세스당 1회다.
 *
 * **`churches.json` 자체는 원본 순서 그대로 둔다.** 데이터 파일을 정렬해 커밋하면
 * 89건이 통째로 재배열돼 diff가 뒤집히고, **CSV 원본과 대조할 길이 사라진다.**
 */
const churches: Church[] = (
  JSON.parse(
    readFileSync(join(process.cwd(), "data", "churches.json"), "utf8"),
  ) as Church[]
).sort(compareChurches);

export function getAllChurches(): Church[] {
  return churches;
}

export function getChurchById(id: string): Church | undefined {
  return churches.find((church) => church.id === id);
}

/** `generateStaticParams`용 */
export function getAllChurchIds(): string[] {
  return churches.map((church) => church.id);
}

/**
 * 홈 미리보기용 무작위 표본 (2026-09-12).
 *
 * **왜 무작위인가.** 89건에서 5건을 보여주는 자리인데, 어떤 고정 규칙으로 뽑아도
 * 그 5건이 **"추천 교회"로 읽힌다.** `/about`이 `평가하거나 순위를 매기지 않습니다`
 * 라고 적어 둔 이상 홈의 붙박이 5건은 그 문장과 부딪친다. 무작위는 그 의심을 없애는
 * 가장 확실한 방법이다 — **뽑히는 규칙 자체가 없다.**
 *
 * ⚠️ **뽑은 뒤 다시 정렬해서 돌려준다.** 무작위 순서 그대로 그리면 화면에 적어 둔
 * `목록은 지역·시군구·교회명 가나다순으로 보여줍니다`가 눈앞에서 거짓이 된다.
 * **고르는 것은 무작위, 보여주는 것은 가나다** — 두 약속이 함께 지켜진다.
 *
 * ⚠️ **원본 배열을 섞지 않는다.** `churches`는 모듈 스코프의 공유 배열이라
 * 제자리에서 섞으면 **같은 프로세스의 다른 화면들(`/churches`·랜딩·sitemap)의
 * 순서까지 망가진다.** 복사본에서 부분 셔플한다.
 *
 * **호출 시점이 곧 무작위 시점이다.** 홈은 `revalidate`로 15분마다 다시 그려지므로
 * 표본도 그때 바뀐다 — `src/app/page.tsx`의 주석 참고.
 */
export function getPreviewChurches(count: number): Church[] {
  const pool = [...churches];
  const take = Math.min(count, pool.length);

  // Fisher–Yates를 앞 `take`칸만 돌린다. 5건 뽑자고 89(→3천)건을 전부 섞을 이유가 없다
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, take).sort(compareChurches);
}
