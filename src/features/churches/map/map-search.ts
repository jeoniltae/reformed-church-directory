// 지도 검색 — 입력한 말로 교회를 찾아 **그 자리로 데려다 주기 위한** 목록을 만든다
//
// ⚠️ **`/churches`의 검색과 목적이 다르다.** 그쪽은 **거르는 것**이 일이라 지역·교단 칩이
// 함께 있고 결과를 카드로 끝까지 보여준다. 여기는 **점프**가 일이다 — 후보를 몇 개만
// 보여주고, 고르면 지도가 그 자리로 간다. **그래서 칩도 무한 목록도 두지 않는다.**
//
// **검색 자체는 새로 짜지 않는다** — `filterChurches`가 교회명·주소·담임목사·지역을
// 이미 훑고 테스트도 있다. 여기서 더하는 것은 **지도에 쓸 수 있는 것만 남기는 일**뿐이다.

import type { Church } from "@/types/church";
import { filterChurches } from "../search";
import { hasCoords } from "./points";

/**
 * 후보를 고른 뒤 데려갈 확대 단계.
 *
 * ⚠️ **클러스터 임계값(8)보다 작아야 한다.** 그보다 넓게 잡으면 찾아간 교회가 묶음 속에
 * 들어가 **마커도 이름표도 보이지 않는다** — "검색했는데 아무 일도 안 일어났다"가 된다.
 * 내 위치(`LOCATE_LEVEL`)와 같은 값인 것은 **둘 다 "동네를 보는 배율"이기 때문**이다.
 */
export const SEARCH_LEVEL = 5;

/**
 * 한 번에 보여줄 후보 수.
 *
 * **고르라고 주는 목록이지 결과 목록이 아니다.** 전부 보고 싶으면 시트가 받아 준다
 * (검색 중에는 시트가 결과만 보여준다). **고신 2,118건이 들어와도 이 상한은 그대로다.**
 */
export const SEARCH_LIMIT = 8;

/**
 * 지도에서 고를 수 있는 후보를 추린다.
 *
 * ⚠️ **좌표 없는 교회는 후보에서 뺀다** — 골라도 데려갈 자리가 없다. 다만 **시트 목록과
 * 검색 결과 수에는 그대로 남는다**(`matchChurches`) — 지도에 못 찍는 것과 검색에 안
 * 걸리는 것은 다른 일이다.
 *
 * 빈 검색어는 빈 목록이다 — 아무것도 치지 않았는데 후보가 뜨면 지도를 가린다.
 */
export function searchChurches(churches: Church[], query: string): Church[] {
  if (!query.trim()) return [];
  return matchChurches(churches, query).filter(hasCoords).slice(0, SEARCH_LIMIT);
}

/**
 * 검색어에 걸리는 교회 전부. **시트가 목록을 좁히는 데 쓴다.**
 *
 * 후보(`searchChurches`)와 달리 **상한도 좌표 조건도 없다** — 시트는 "이 말에 걸리는
 * 교회가 무엇인가"를 말하는 자리이고, 지도에 찍을 수 있는지는 별개 사정이다.
 */
export function matchChurches(churches: Church[], query: string): Church[] {
  if (!query.trim()) return churches;
  return filterChurches(churches, { q: query });
}
