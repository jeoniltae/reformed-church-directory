// 도로명주소 좌표제공 API의 평면좌표(UTM-K)를 WGS84 위경도로 바꾼다

import proj4 from "proj4";

/**
 * 좌표제공 API가 돌려주는 `entX`·`entY`의 좌표계 정의.
 *
 * **이름이 비슷한 한국 좌표계가 여럿이고 혼동하면 수백 미터가 어긋난다.**
 *   EPSG:5179 — UTM-K (GRS80). 도로명주소 API가 쓰는 것, 여기서 쓰는 것
 *   EPSG:5181 — 카카오맵 계열 TM128
 *   EPSG:5174 — 구 중부원점 (Bessel 타원체)
 *
 * proj4에 내장돼 있지 않아 정의를 직접 넣는다.
 */
const UTM_K =
  "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs";

export interface LatLng {
  lat: number;
  lng: number;
}

/** 소수점 6자리면 약 11cm 해상도다. 교회 위치에는 차고 넘친다 */
function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function utmkToWgs84(entX: number, entY: number): LatLng {
  const [lng, lat] = proj4(UTM_K, "WGS84", [entX, entY]);
  return { lat: round6(lat), lng: round6(lng) };
}

/**
 * 변환 결과가 대한민국 범위 안인지 본다.
 * 좌표계를 잘못 잡으면 그럴듯하지만 엉뚱한 값이 나오므로, 배치 전에 이걸로 거른다.
 */
export function isWithinKorea({ lat, lng }: LatLng): boolean {
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}
