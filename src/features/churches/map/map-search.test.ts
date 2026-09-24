// 지도 검색 단위 테스트 — 후보와 결과가 서로 다른 것을 고정한다

import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import {
  matchChurches,
  searchChurches,
  SEARCH_LEVEL,
  SEARCH_LIMIT,
} from "./map-search";

const church = (over: Partial<Church>): Church =>
  ({
    id: over.name ?? "테스트교회",
    name: "테스트교회",
    region: "서울",
    address: "서울 어딘가",
    pastor: "아무개",
    source: "자체 수집",
    lat: 37.5,
    lng: 127,
    ...over,
  }) as Church;

describe("searchChurches", () => {
  it("빈 검색어에는 후보를 주지 않는다", () => {
    const churches = [church({ name: "언약교회" })];
    expect(searchChurches(churches, "")).toEqual([]);
    expect(searchChurches(churches, "   ")).toEqual([]);
  });

  /**
   * ⚠️ **골라도 데려갈 자리가 없는 교회는 후보가 아니다.** 지금은 좌표가 전량 있지만
   * **확장하면 다시 생긴다** — 조건을 지우지 않는다.
   */
  it("좌표 없는 교회는 후보에서 뺀다", () => {
    const churches = [
      church({ name: "좌표있음" }),
      church({ name: "좌표없음", lat: undefined, lng: undefined }),
    ];

    expect(searchChurches(churches, "좌표").map((c) => c.name)).toEqual([
      "좌표있음",
    ]);
  });

  it("후보 수에 상한이 있다", () => {
    const churches = Array.from({ length: SEARCH_LIMIT + 5 }, (_, i) =>
      church({ name: `언약교회${i}`, id: `언약교회${i}` }),
    );

    expect(searchChurches(churches, "언약")).toHaveLength(SEARCH_LIMIT);
  });

  // `filterChurches`를 그대로 쓰므로 교회명 말고도 걸린다 — 그 연결이 끊기지 않게 한다
  it("담임목사·주소로도 찾는다", () => {
    const churches = [church({ name: "언약교회", pastor: "이승구" })];

    expect(searchChurches(churches, "이승구")).toHaveLength(1);
    expect(searchChurches(churches, "어딘가")).toHaveLength(1);
  });
});

describe("matchChurches", () => {
  /**
   * ⚠️ **후보와 다르다.** 시트는 "이 말에 걸리는 교회가 무엇인가"를 말하는 자리라
   * **상한도 좌표 조건도 없다** — 지도에 못 찍는 것과 검색에 안 걸리는 것은 다른 일이다.
   */
  it("좌표가 없어도 결과에는 남는다", () => {
    const churches = [
      church({ name: "좌표없음", lat: undefined, lng: undefined }),
    ];

    expect(matchChurches(churches, "좌표없음")).toHaveLength(1);
    expect(searchChurches(churches, "좌표없음")).toHaveLength(0);
  });

  it("빈 검색어는 전체를 돌려준다 — 목록을 좁히지 않는다", () => {
    const churches = [church({ name: "가" }), church({ name: "나" })];
    expect(matchChurches(churches, "")).toHaveLength(2);
  });
});

describe("SEARCH_LEVEL", () => {
  /**
   * ⚠️ **클러스터 임계값(`MIN_CLUSTER_LEVEL` = 8)보다 작아야 한다.** 그보다 넓으면
   * 찾아간 교회가 묶음 속이라 **마커도 이름표도 안 보인다.**
   */
  it("묶임이 풀리는 배율이다", () => {
    expect(SEARCH_LEVEL).toBeLessThan(8);
  });
});
