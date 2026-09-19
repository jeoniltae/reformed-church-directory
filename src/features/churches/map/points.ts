// 지도에 찍을 점 추리기 — 컴포넌트에서 떼어내 단위 테스트가 닿게 한다

import type { Church } from "@/types/church";

/** 좌표가 확인된 교회. `lat`/`lng`가 선택 필드라 좁혀 두면 컴포넌트가 단순해진다 */
export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

/** 전국을 담는 기본 시야 — 좌표가 하나도 없을 때만 쓴다 (대한민국 중앙부) */
export const FALLBACK_CENTER = { lat: 36.5, lng: 127.8 };

/**
 * 좌표가 있는 교회만 남긴다.
 *
 * ⚠️ **좌표 없는 교회를 지도에서 빼는 것이 끝이 아니다.** 그 교회는 **목록에 반드시
 * 남아야 한다**(`docs/지도-작업.md` 6단계). 지금은 1건(군산진성교회)이지만
 * **확장하면 비율이 달라질 수 있다** — 고신 KML의 좌표 확보율은 아직 모른다.
 *
 * **`0`을 버리지 않는다.** `!church.lat`로 거르면 적도·본초자오선이 사라진다.
 * 국내 데이터에는 나올 수 없는 값이지만, **조건을 틀리게 쓰는 습관이 남는 쪽이 문제다.**
 */
export function toMapPoints(churches: Church[]): MapPoint[] {
  const points: MapPoint[] = [];
  for (const { id, name, lat, lng } of churches) {
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    points.push({ id, name, lat, lng });
  }
  return points;
}

/**
 * 점들의 한가운데. **경계 상자의 중심**이지 평균이 아니다 —
 * 평균은 점이 몰린 쪽으로 끌려가 **서울 29곳 때문에 전국 지도가 수도권으로 쏠린다.**
 *
 * 점이 하나면 그 점이 곧 중심이고, 없으면 전국 기본 시야를 돌려준다.
 */
export function centerOf(points: MapPoint[]): { lat: number; lng: number } {
  if (points.length === 0) return FALLBACK_CENTER;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const { lat, lng } of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}
