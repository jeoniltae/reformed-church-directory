// 가까운 교회 추리기 단위 테스트 — 반경·상한·결정성을 고정한다
//
// ⚠️ **거리를 상수 값에 맞춰 손으로 적지 않는다.** `NEARBY_RADIUS_KM`·`NEARBY_LIMIT`은
// 실물을 보고 조정할 값이라(`docs/지도-작업.md`), 숫자를 박아 두면 **값을 한 줄 고칠
// 때마다 이 파일이 깨진다.** 픽스처는 상수에서 거리를 계산해 만든다.

import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import {
  distanceKm,
  NEARBY_LIMIT,
  NEARBY_RADIUS_KM,
  nearbyChurches,
} from "./nearby";

/** 서울시청 */
const BASE = { lat: 37.5663, lng: 126.9779 };

/**
 * 기준점에서 **북쪽으로 `km`만큼** 옮긴 좌표.
 *
 * 위도 1도는 경도와 달리 어디서나 약 111.195km라, 북쪽으로만 옮기면 **위도만으로
 * 거리를 정할 수 있다.** 동서로 옮기면 위도에 따라 간격이 달라져 픽스처가 흔들린다.
 */
const northOf = (km: number) => ({
  lat: BASE.lat + km / 111.195,
  lng: BASE.lng,
});

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

const target = church({ id: "주인공", ...BASE });

describe("distanceKm", () => {
  /** 서울시청 ↔ 강남역. 직선거리 약 8.8km — 끝자리는 지구 반지름 상수에 따라 흔들린다 */
  it("실측 좌표의 거리를 낸다", () => {
    const gangnam = { lat: 37.4979, lng: 127.0276 };
    const km = distanceKm(BASE, gangnam);

    expect(km).toBeGreaterThan(8);
    expect(km).toBeLessThan(9.5);
  });

  it("같은 점은 0이다", () => {
    expect(distanceKm(BASE, { ...BASE })).toBe(0);
  });

  it("순서를 바꿔도 같다", () => {
    const other = northOf(3);
    expect(distanceKm(BASE, other)).toBeCloseTo(distanceKm(other, BASE), 10);
  });
});

describe("nearbyChurches", () => {
  it("가까운 순으로 돌려준다", () => {
    const all = [
      target,
      church({ id: "먼쪽", ...northOf(9) }),
      church({ id: "가까운쪽", ...northOf(2) }),
      church({ id: "중간", ...northOf(5) }),
    ];

    expect(nearbyChurches(all, target).map((c) => c.id)).toEqual([
      "가까운쪽",
      "중간",
      "먼쪽",
    ]);
  });

  it("자기 자신은 뺀다", () => {
    const all = [target, church({ id: "이웃", ...northOf(1) })];

    expect(nearbyChurches(all, target).map((c) => c.id)).toEqual(["이웃"]);
  });

  /** 같은 자리에 있는 다른 교회는 **거리가 0이어도 남는다** — 뺄 기준은 거리가 아니라 id다 */
  it("좌표가 같아도 다른 교회면 남긴다", () => {
    const all = [target, church({ id: "같은건물", ...BASE })];

    expect(nearbyChurches(all, target).map((c) => c.id)).toEqual(["같은건물"]);
  });

  it("반경 밖은 뺀다", () => {
    const all = [
      target,
      church({ id: "안", ...northOf(NEARBY_RADIUS_KM * 0.5) }),
      church({ id: "밖", ...northOf(NEARBY_RADIUS_KM * 1.5) }),
    ];

    expect(nearbyChurches(all, target).map((c) => c.id)).toEqual(["안"]);
  });

  /**
   * ⚠️ **상한이 없으면 고신 2,118건 확장 때 수도권 상세가 수십 줄이 된다.**
   * 잘라내는 쪽은 **먼 쪽**이어야 한다 — 가까운 순으로 정렬한 뒤 자른다.
   */
  it("상한까지만 돌려주고, 남기는 것은 가까운 쪽이다", () => {
    const count = NEARBY_LIMIT + 2;
    const all = [
      target,
      // 전부 반경 안에 들어가도록 반경을 `count + 1`로 나눠 늘어놓는다
      ...Array.from({ length: count }, (_, i) =>
        church({
          id: `이웃${i}`,
          ...northOf((NEARBY_RADIUS_KM * (i + 1)) / (count + 1)),
        }),
      ),
    ];

    const nearby = nearbyChurches(all, target);

    expect(nearby).toHaveLength(NEARBY_LIMIT);
    expect(nearby.map((c) => c.id)).toEqual(
      Array.from({ length: NEARBY_LIMIT }, (_, i) => `이웃${i}`),
    );
  });

  /**
   * ⚠️ **좌표 없는 주인공은 빈 배열이다.** 같은 시군구로 넓히지 않는다 —
   * **"가깝다"고 말해 놓고 실제 거리가 어긋나는 것**보다 말하지 않는 편이 낫다.
   * 화면은 이 빈 배열 하나로 섹션을 통째로 접는다.
   */
  it("주인공에 좌표가 없으면 빈 배열이다", () => {
    const noCoords = church({ id: "좌표없음" });
    const all = [noCoords, church({ id: "이웃", ...northOf(1) })];

    expect(nearbyChurches(all, noCoords)).toEqual([]);
  });

  it("좌표 없는 후보는 뺀다", () => {
    const all = [
      target,
      church({ id: "좌표없음" }),
      church({ id: "이웃", ...northOf(1) }),
    ];

    expect(nearbyChurches(all, target).map((c) => c.id)).toEqual(["이웃"]);
  });

  /** `!church.lat`로 거르면 사라진다 — `points.ts`의 `hasCoords`가 막아 주는 자리다 */
  it("`0`을 없는 값으로 취급하지 않는다", () => {
    const origin = church({ id: "영점", lat: 0, lng: 0 });
    const all = [origin, church({ id: "이웃", lat: 0, lng: 0.01 })];

    expect(nearbyChurches(all, origin).map((c) => c.id)).toEqual(["이웃"]);
  });

  /**
   * ⚠️ **빌드마다 결과가 달라지면 SSG 산출물이 흔들린다.** 거리가 같을 때
   * 입력 순서에 기대면 `churches.json`의 줄 순서가 화면 순서를 바꾼다.
   */
  it("거리가 같으면 id 순이다 — 결정적이어야 한다", () => {
    const same = northOf(3);
    const all = [
      target,
      church({ id: "나교회", ...same }),
      church({ id: "가교회", ...same }),
    ];

    expect(nearbyChurches(all, target).map((c) => c.id)).toEqual([
      "가교회",
      "나교회",
    ]);
    // 입력 순서를 뒤집어도 같은 결과여야 한다
    expect(
      nearbyChurches([all[0], all[2], all[1]], target).map((c) => c.id),
    ).toEqual(["가교회", "나교회"]);
  });

  it("후보가 하나도 없으면 빈 배열이다", () => {
    expect(nearbyChurches([target], target)).toEqual([]);
  });
});
