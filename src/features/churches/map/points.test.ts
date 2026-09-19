// 지도 점 추리기 단위 테스트 — 좌표 없는 교회와 쏠린 분포를 고정한다

import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import { centerOf, FALLBACK_CENTER, toMapPoints } from "./points";

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

  it("id·이름·좌표만 남긴다 — 컴포넌트가 볼 것을 좁힌다", () => {
    const [point] = toMapPoints([
      church({ id: "언약교회-하남시", name: "언약교회", lat: 37.5, lng: 127.2 }),
    ]);

    expect(point).toEqual({
      id: "언약교회-하남시",
      name: "언약교회",
      lat: 37.5,
      lng: 127.2,
    });
  });
});

describe("centerOf", () => {
  /**
   * ⚠️ **평균이 아니라 경계 상자의 중심이다.** 평균을 쓰면 점이 몰린 쪽으로 끌려가
   * **서울 29곳 때문에 전국 지도가 수도권으로 쏠린다.**
   */
  it("한쪽에 몰린 점들에 끌려가지 않는다", () => {
    const seoulHeavy = [
      { id: "a", name: "a", lat: 37.5, lng: 127.0 },
      { id: "b", name: "b", lat: 37.5, lng: 127.0 },
      { id: "c", name: "c", lat: 37.5, lng: 127.0 },
      { id: "d", name: "d", lat: 33.5, lng: 126.5 }, // 제주
    ];

    // 평균이라면 위도가 37.0 근처로 서울에 붙는다
    expect(centerOf(seoulHeavy)).toEqual({ lat: 35.5, lng: 126.75 });
  });

  it("점이 하나면 그 점이 중심이다", () => {
    expect(centerOf([{ id: "a", name: "a", lat: 35.1, lng: 129.0 }])).toEqual({
      lat: 35.1,
      lng: 129.0,
    });
  });

  it("점이 없으면 전국 기본 시야다", () => {
    expect(centerOf([])).toBe(FALLBACK_CENTER);
  });
});
