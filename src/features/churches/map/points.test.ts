// 지도 점 추리기 단위 테스트 — 좌표 없는 교회·쏠린 분포·주인공 중심 경계를 고정한다

import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import {
  boundsAround,
  centerOf,
  FALLBACK_CENTER,
  hasCoords,
  MIN_HALF_SPAN_DEG,
  toMapPoints,
} from "./points";

const church = (over: Partial<Church>): Church =>
  ({
    id: "테스트교회-어딘가",
    name: "테스트교회",
    region: "서울",
    address: "어딘가",
    pastor: "아무개",
    source: "자체 수집",
    ...over,
  }) as Church;

describe("toMapPoints", () => {
  it("좌표 없는 교회를 뺀다", () => {
    const points = toMapPoints([
      church({ id: "있음", lat: 37.5, lng: 127 }),
      church({ id: "없음" }),
    ]);

    expect(points.map((p) => p.id)).toEqual(["있음"]);
  });

  // `!church.lat`로 거르면 사라진다. 국내에는 없는 값이지만 조건을 틀리게 쓰지 않는다
  it("`0`을 없는 값으로 취급하지 않는다", () => {
    expect(toMapPoints([church({ lat: 0, lng: 0 })])).toHaveLength(1);
  });

  it("id·이름·지역·좌표만 남긴다 — 컴포넌트가 볼 것을 좁힌다", () => {
    const [point] = toMapPoints([
      church({
        id: "언약교회-하남시",
        name: "언약교회",
        region: "경기",
        subRegion: "하남시",
        lat: 37.5,
        lng: 127.2,
      }),
    ]);

    expect(point).toEqual({
      id: "언약교회-하남시",
      name: "언약교회",
      place: "경기 하남시",
      lat: 37.5,
      lng: 127.2,
    });
  });

  // 말풍선 둘째 줄이 `서울 `처럼 끊긴 채 나가지 않게 한다
  it("시군구가 없으면 시도만 적는다", () => {
    const [point] = toMapPoints([
      church({ region: "세종", subRegion: undefined, lat: 36.5, lng: 127.2 }),
    ]);

    expect(point.place).toBe("세종");
  });
});

describe("hasCoords", () => {
  /**
   * ⚠️ **`/map`의 "지도에 표시되지 않는 교회 N곳"이 이 판정을 함께 쓴다.**
   * 조건이 갈리면 **화면이 "없다"고 말한 교회가 지도에는 찍힌다.**
   */
  it("좌표가 둘 다 있어야 참이다", () => {
    expect(hasCoords(church({ lat: 37.5, lng: 127 }))).toBe(true);
    expect(hasCoords(church({ lat: 37.5 }))).toBe(false);
    expect(hasCoords(church({}))).toBe(false);
  });

  it("`0`을 없는 값으로 취급하지 않는다", () => {
    expect(hasCoords(church({ lat: 0, lng: 0 }))).toBe(true);
  });
});

describe("centerOf", () => {
  /**
   * ⚠️ **평균이 아니라 경계 상자의 중심이다.** 평균을 쓰면 점이 몰린 쪽으로 끌려가
   * **서울 29곳 때문에 전국 지도가 수도권으로 쏠린다.**
   */
  it("한쪽에 몰린 점들에 끌려가지 않는다", () => {
    const seoulHeavy = [
      { id: "a", name: "a", place: "어딘가", lat: 37.5, lng: 127.0 },
      { id: "b", name: "b", place: "어딘가", lat: 37.5, lng: 127.0 },
      { id: "c", name: "c", place: "어딘가", lat: 37.5, lng: 127.0 },
      { id: "d", name: "d", place: "어딘가", lat: 33.5, lng: 126.5 }, // 제주
    ];

    // 평균이라면 위도가 37.0 근처로 서울에 붙는다
    expect(centerOf(seoulHeavy)).toEqual({ lat: 35.5, lng: 126.75 });
  });

  it("점이 하나면 그 점이 중심이다", () => {
    expect(centerOf([{ id: "a", name: "a", place: "어딘가", lat: 35.1, lng: 129.0 }])).toEqual({
      lat: 35.1,
      lng: 129.0,
    });
  });

  it("점이 없으면 전국 기본 시야다", () => {
    expect(centerOf([])).toBe(FALLBACK_CENTER);
  });
});

describe("boundsAround", () => {
  const CENTER = { lat: 37.5663, lng: 126.9779 };

  const point = (lat: number, lng: number) => ({
    id: `${lat},${lng}`,
    name: "교회",
    place: "서울",
    lat,
    lng,
  });

  /**
   * ⚠️ **이것이 `centerOf` + `setBounds`와 갈리는 지점이다.** 상세 화면에는 주인공이
   * 있는데, 경계 상자의 중심으로 맞추면 **지금 보고 있는 그 교회가 화면 한가운데에서
   * 밀려난다.** 대칭으로 만들면 주인공이 언제나 정중앙이다.
   */
  it("중심이 경계의 정확한 한가운데다", () => {
    // 북동쪽으로만 퍼진 분포 — 경계 상자의 중심이라면 그쪽으로 끌려간다
    const { sw, ne } = boundsAround(CENTER, [
      point(CENTER.lat + 0.1, CENTER.lng + 0.08),
      point(CENTER.lat + 0.05, CENTER.lng + 0.02),
    ]);

    expect((sw.lat + ne.lat) / 2).toBeCloseTo(CENTER.lat, 10);
    expect((sw.lng + ne.lng) / 2).toBeCloseTo(CENTER.lng, 10);
  });

  it("모든 점이 경계 안에 들어온다", () => {
    const points = [
      point(CENTER.lat + 0.1, CENTER.lng - 0.03),
      point(CENTER.lat - 0.04, CENTER.lng + 0.09),
      point(CENTER.lat + 0.02, CENTER.lng + 0.01),
    ];
    const { sw, ne } = boundsAround(CENTER, points);

    for (const p of points) {
      expect(p.lat).toBeGreaterThanOrEqual(sw.lat);
      expect(p.lat).toBeLessThanOrEqual(ne.lat);
      expect(p.lng).toBeGreaterThanOrEqual(sw.lng);
      expect(p.lng).toBeLessThanOrEqual(ne.lng);
    }
  });

  /** 가장 먼 점이 양쪽을 함께 정한다 — 가까운 쪽에 맞추면 먼 점이 화면 밖으로 나간다 */
  it("한쪽으로만 퍼져도 먼 쪽이 폭을 정한다", () => {
    const { sw, ne } = boundsAround(CENTER, [
      point(CENTER.lat + 0.1, CENTER.lng),
    ]);

    expect(ne.lat - CENTER.lat).toBeCloseTo(0.1, 10);
    expect(CENTER.lat - sw.lat).toBeCloseTo(0.1, 10);
  });

  /**
   * ⚠️ **최소 span이 없으면 `setBounds`가 최대 확대로 튄다.** 주변 교회가 300m 옆에
   * 한 곳뿐인 상세에서 실제로 일어나는 일이다 — 건물 몇 채만 보이는 지도가 된다.
   */
  it("아주 가까운 점뿐이어도 최소 폭을 지킨다", () => {
    const { sw, ne } = boundsAround(CENTER, [
      point(CENTER.lat + 0.0002, CENTER.lng),
    ]);

    expect(ne.lat - CENTER.lat).toBeCloseTo(MIN_HALF_SPAN_DEG, 10);
    expect(CENTER.lat - sw.lat).toBeCloseTo(MIN_HALF_SPAN_DEG, 10);
    expect(ne.lng - CENTER.lng).toBeCloseTo(MIN_HALF_SPAN_DEG, 10);
  });

  /** 함수는 총체적이어야 한다 — 화면이 이 경우를 거르더라도 여기서 무너지지 않는다 */
  it("점이 없으면 최소 폭짜리 상자를 돌려준다", () => {
    const { sw, ne } = boundsAround(CENTER, []);

    expect(ne.lat - sw.lat).toBeCloseTo(MIN_HALF_SPAN_DEG * 2, 10);
    expect(ne.lng - sw.lng).toBeCloseTo(MIN_HALF_SPAN_DEG * 2, 10);
  });

  /** 주인공 자신이 목록에 섞여 있어도 결과가 달라지지 않는다 — 부르는 쪽이 그렇게 넘긴다 */
  it("중심과 같은 점이 섞여 있어도 폭을 흔들지 않는다", () => {
    const far = point(CENTER.lat + 0.05, CENTER.lng);
    const withSelf = boundsAround(CENTER, [point(CENTER.lat, CENTER.lng), far]);
    const without = boundsAround(CENTER, [far]);

    expect(withSelf).toEqual(without);
  });
});
