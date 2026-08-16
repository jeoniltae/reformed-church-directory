// UTM-K → WGS84 변환 단위 테스트 — 좌표계를 잘못 잡으면 여기서 걸린다

import { describe, expect, it } from "vitest";
import { isWithinKorea, utmkToWgs84 } from "./coords.mts";

/**
 * 도로명주소 API에서 실제로 받아온 값이다 (2026-08-12).
 * 남북·동서로 멀리 떨어진 세 지점을 쓴다 — 한 점만으로는 좌표계 오류를 못 걸러낸다.
 */
const SAMPLES = [
  {
    주소: "서울특별시 관악구 조원로 120",
    entX: 948346,
    entY: 1943026,
    lat: 37.485032,
    lng: 126.915732,
  },
  {
    주소: "부산광역시 동래구 명륜로 261",
    entX: 1144249,
    entY: 1692409,
    lat: 35.216688,
    lng: 129.084904,
  },
  {
    주소: "제주특별자치도 제주시 서광로 174",
    entX: 908501,
    entY: 1501320,
    lat: 33.499835,
    lng: 126.514947,
  },
] as const;

describe("utmkToWgs84", () => {
  it("실제 API 좌표를 제자리로 변환한다", () => {
    for (const s of SAMPLES) {
      const { lat, lng } = utmkToWgs84(s.entX, s.entY);
      // 소수점 4자리 ≈ 11m. EPSG:5174(구 중부원점)로 잘못 잡으면 수백 m 어긋나 걸린다
      expect(lat, s.주소).toBeCloseTo(s.lat, 4);
      expect(lng, s.주소).toBeCloseTo(s.lng, 4);
    }
  });
});

describe("isWithinKorea", () => {
  it("변환된 국내 좌표를 통과시킨다", () => {
    for (const s of SAMPLES) {
      expect(isWithinKorea(utmkToWgs84(s.entX, s.entY)), s.주소).toBe(true);
    }
  });

  it("범위 밖을 걸러낸다", () => {
    expect(isWithinKorea({ lat: 0, lng: 0 })).toBe(false);
    expect(isWithinKorea({ lat: 35.6895, lng: 139.6917 })).toBe(false); // 도쿄
  });
});
