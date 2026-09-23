// 지도에 찍을 점 추리기 — 컴포넌트에서 떼어내 단위 테스트가 닿게 한다

import type { Church } from "@/types/church";

/**
 * 위경도 한 쌍. **이 모듈이 좌표의 원산지다** — `nearby.ts`도 여기서 가져다 쓴다.
 * 같은 모양을 파일마다 다시 적으면 어느 것이 정본인지 알 수 없어진다.
 */
export interface Coords {
  lat: number;
  lng: number;
}

/** 좌표가 확인된 교회. `lat`/`lng`가 선택 필드라 좁혀 두면 컴포넌트가 단순해진다 */
export interface MapPoint {
  id: string;
  name: string;
  /** 말풍선의 둘째 줄. `서울 강동구`처럼 이미 합쳐 둔다 — `ChurchRow`와 같은 표기다 */
  place: string;
  lat: number;
  lng: number;
}

/** 좌표가 채워진 교회. `Church`를 좁혀 `lat`/`lng`를 선택 필드에서 꺼낸다 */
type LocatedChurch = Church & { lat: number; lng: number };

/**
 * 지도에 찍을 수 있는 교회인가.
 *
 * **판정을 이 함수 하나로 모은다.** 지도에 찍는 쪽(`toMapPoints`)과 **"지도에
 * 표시되지 않는 교회 N곳"을 세는 쪽**(`/map`)이 조건을 따로 쓰면, 한쪽만 고쳐졌을 때
 * **화면이 "없다"고 말한 교회가 지도에는 찍히는** 어긋남이 생긴다.
 *
 * **`0`을 버리지 않는다.** `!church.lat`로 거르면 적도·본초자오선이 사라진다.
 * 국내 데이터에는 나올 수 없는 값이지만, **조건을 틀리게 쓰는 습관이 남는 쪽이 문제다.**
 */
export function hasCoords(church: Church): church is LocatedChurch {
  return typeof church.lat === "number" && typeof church.lng === "number";
}

/** 전국을 담는 기본 시야 — 좌표가 하나도 없을 때만 쓴다 (대한민국 중앙부) */
export const FALLBACK_CENTER: Coords = { lat: 36.5, lng: 127.8 };

/**
 * 좌표가 있는 교회만 남긴다.
 *
 * ⚠️ **좌표 없는 교회를 지도에서 빼는 것이 끝이 아니다.** 그 교회는 **목록에 반드시
 * 남아야 한다**(`docs/지도-작업.md` 6단계). 지금은 1건(군산진성교회)이지만
 * **확장하면 비율이 달라질 수 있다** — 고신 KML의 좌표 확보율은 아직 모른다.
 *
 * 판정은 `hasCoords`가 한다 — `/map`의 안내 줄과 같은 조건을 쓰기 위해서다.
 */
export function toMapPoints(churches: Church[]): MapPoint[] {
  const points: MapPoint[] = [];
  for (const church of churches) {
    if (!hasCoords(church)) continue;
    const { id, name, region, subRegion, lat, lng } = church;
    points.push({
      id,
      name,
      place: subRegion ? `${region} ${subRegion}` : region,
      lat,
      lng,
    });
  }
  return points;
}

/**
 * 점들의 한가운데. **경계 상자의 중심**이지 평균이 아니다 —
 * 평균은 점이 몰린 쪽으로 끌려가 **서울 29곳 때문에 전국 지도가 수도권으로 쏠린다.**
 *
 * 점이 하나면 그 점이 곧 중심이고, 없으면 전국 기본 시야를 돌려준다.
 */
export function centerOf(points: MapPoint[]): Coords {
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

/**
 * `boundsAround`가 보장하는 **반쪽 폭의 하한**(도). 약 500m라 상자 한 변이 1km쯤 된다.
 *
 * ⚠️ **없으면 `setBounds`가 최대 확대로 튄다.** 주변 교회가 300m 옆에 한 곳뿐인
 * 상세에서 실제로 일어나는 일이고, 그러면 **건물 몇 채만 보이는 지도**가 된다.
 *
 * **위도·경도에 같은 값을 쓴다.** 위도 1도(약 111km)와 국내 경도 1도(약 88km)가
 * 달라 상자가 정확한 정사각형은 아니지만, 이 크기에서 차이는 100m 남짓이라 화면에서
 * 구분되지 않는다. 삼각함수를 들이는 대신 단순하게 둔다.
 */
export const MIN_HALF_SPAN_DEG = 0.0045;

/** 지도에 넘길 경계 상자 — 카카오 `LatLngBounds(sw, ne)`와 같은 짜임이다 */
export interface MapBounds {
  sw: Coords;
  ne: Coords;
}

/**
 * **중심을 한가운데 고정한 채** 모든 점을 담는 경계.
 *
 * ⚠️ **`centerOf` + `setBounds`와 갈리는 지점이다.** 그쪽은 경계 상자의 중심을 쓰므로
 * `/map`처럼 **주인공이 없는 화면**에 맞다. 교회 상세에는 주인공이 있어서, 같은 방식을
 * 쓰면 **지금 보고 있는 그 교회가 화면 한가운데에서 밀려난다.**
 *
 * 중심에서 가장 먼 점까지의 거리를 **양쪽에 똑같이** 주면 대칭이 되어, 주인공이 언제나
 * 정중앙에 서고 나머지도 전부 들어온다. 폭은 `MIN_HALF_SPAN_DEG` 아래로 내려가지 않는다.
 */
export function boundsAround(center: Coords, points: MapPoint[]): MapBounds {
  let halfLat = MIN_HALF_SPAN_DEG;
  let halfLng = MIN_HALF_SPAN_DEG;

  for (const { lat, lng } of points) {
    halfLat = Math.max(halfLat, Math.abs(lat - center.lat));
    halfLng = Math.max(halfLng, Math.abs(lng - center.lng));
  }

  return {
    sw: { lat: center.lat - halfLat, lng: center.lng - halfLng },
    ne: { lat: center.lat + halfLat, lng: center.lng + halfLng },
  };
}
