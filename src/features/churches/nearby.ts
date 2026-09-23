// 가까운 교회 추리기 — 교회 상세의 "가까운 교회" 블록이 쓰는 순수 함수
//
// **왜 거리인가** (2026-09-23). 상세에서 다른 교회로 가는 길은 `비슷한 교회 찾기`의
// **시도 단위 랜딩뿐**이었다. 이 사이트가 실제로 받는 질문은 "우리 동네에 개혁주의
// 교회 있나?"인데, **강동구에서 보고 있는 사람에게 "서울 교회 30곳"은 답이 아니다.**
//
// **`landing.ts`와 같은 층에 둔다** — 지도만의 개념이 아니다. 지도는 이 결과를 찍을
// 뿐이고, 정본은 화면에 글자로 나가는 목록이다(지도 컨테이너는 `aria-hidden`이다).

import type { Church } from "@/types/church";
import { hasCoords } from "./map/points";

/**
 * "가깝다"고 부를 반경(km).
 *
 * **개혁주의 교회는 희소해서 좁히면 대부분의 상세에서 섹션이 사라지고, 넓히면
 * 걸어갈 수 없는 곳을 가깝다고 부르게 된다.** 실물을 보고 조정할 값이라
 * `nearby.test.ts`는 이 숫자에 기대지 않는다 — 픽스처를 이 값에서 계산한다.
 */
export const NEARBY_RADIUS_KM = 15;

/**
 * 한 상세에 보일 최대 교회 수.
 *
 * ⚠️ **고신 2,118건 확장을 전제로 처음부터 둔다.** 지금은 반경 안에 몇 곳 없지만,
 * 확장하면 수도권 상세가 **수십 줄짜리 목록**이 된다. 지도 마커도 같은 수만큼 늘어
 * 주인공이 묻힌다.
 */
export const NEARBY_LIMIT = 4;

export interface Coords {
  lat: number;
  lng: number;
}

/** 지구 평균 반지름(km) */
const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * 두 좌표 사이의 대권 거리(km). haversine.
 *
 * **평면 근사를 쓰지 않는다.** 국내 범위에서는 오차가 작지만, 위도에 따라 경도 1도의
 * 실제 길이가 달라져 **제주와 서울에서 같은 숫자가 다른 거리를 뜻하게 된다.**
 */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * `target`에서 반경 안에 있는 다른 교회를 **가까운 순으로** 돌려준다. 상한까지만.
 *
 * ⚠️ **좌표 판정은 `hasCoords`를 쓴다** — 조건을 새로 쓰면 `/map`의 "지도에 표시되지
 * 않는 교회 N곳"과 어긋난다. 그 함수 주석이 이미 같은 경고를 하고 있다.
 *
 * **`target`에 좌표가 없으면 빈 배열이다.** 같은 시군구로 넓히지 않는다 —
 * **"가깝다"고 말해 놓고 실제 거리가 어긋나는 것**보다 말하지 않는 편이 낫다.
 * 화면은 이 빈 배열 하나로 섹션을 통째로 접는다(좌표는 있는데 반경 안이 비어도 같다).
 */
export function nearbyChurches(all: Church[], target: Church): Church[] {
  if (!hasCoords(target)) return [];

  const scored: { church: Church; km: number }[] = [];
  for (const church of all) {
    if (church.id === target.id) continue;
    if (!hasCoords(church)) continue;

    const km = distanceKm(target, church);
    if (km > NEARBY_RADIUS_KM) continue;
    scored.push({ church, km });
  }

  /*
    ⚠️ **거리가 같을 때 입력 순서에 기대지 않는다.** 그러면 `churches.json`의 줄
    순서가 화면 순서를 바꾸고, **빌드마다 SSG 산출물이 흔들린다.** id는 유일하므로
    이 비교로 순서가 완전히 정해진다.
  */
  scored.sort((a, b) => a.km - b.km || (a.church.id < b.church.id ? -1 : 1));

  return scored.slice(0, NEARBY_LIMIT).map((entry) => entry.church);
}
