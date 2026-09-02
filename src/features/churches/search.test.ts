// 교회 검색·필터 단위 테스트 — 실제 보유 데이터의 표기를 본떠 최소 표본을 만든다

import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import {
  collectDenominationGroups,
  collectRegionCounts,
  collectRegions,
  filterChurches,
} from "./search";

const churches: Church[] = [
  {
    id: "언약교회-강동구",
    name: "언약교회",
    region: "서울",
    subRegion: "강동구",
    address: "서울 강동구 강일동 69",
    pastor: "이승구",
    denomination: "합신",
    denominationGroup: "합신 계열",
    source: "자체 수집",
  },
  {
    id: "한길교회-광진구",
    name: "한길교회",
    region: "서울",
    subRegion: "광진구",
    address: "서울특별시 광진구 천호대로132길 8 (구의동)",
    pastor: "손재익",
    denomination: "고신",
    denominationGroup: "고신·고려 계열",
    source: "자체 수집",
  },
  {
    // 교단이 없는 6건을 대표한다 — 묶음 필터에서 빠지는 것이 정상이다
    id: "새언약교회-김포시",
    name: "새 언약 교회",
    region: "경기",
    subRegion: "김포시",
    address: "경기도 김포시 김포한강11로 38 (운양동)",
    pastor: "유해신",
    source: "자체 수집",
  },
];

describe("filterChurches", () => {
  it("검색어가 없으면 전부 돌려준다", () => {
    expect(filterChurches(churches, {})).toHaveLength(3);
    expect(filterChurches(churches, { q: "  " })).toHaveLength(3);
  });

  it("공백이 섞인 검색어도 교회명에 일치시킨다", () => {
    // 검색어와 데이터 양쪽에서 공백을 없애므로 어느 쪽이 띄어져 있어도 걸린다
    expect(filterChurches(churches, { q: "언약교회" }).map((c) => c.id)).toEqual(
      ["언약교회-강동구", "새언약교회-김포시"],
    );
    expect(filterChurches(churches, { q: "새 언약" }).map((c) => c.id)).toEqual([
      "새언약교회-김포시",
    ]);
  });

  it("주소와 담임목사명으로도 찾는다", () => {
    expect(filterChurches(churches, { q: "천호대로" }).map((c) => c.id)).toEqual(
      ["한길교회-광진구"],
    );
    expect(filterChurches(churches, { q: "손재익" }).map((c) => c.id)).toEqual([
      "한길교회-광진구",
    ]);
  });

  it("지역으로 거른다", () => {
    expect(filterChurches(churches, { region: "서울" })).toHaveLength(2);
    expect(filterChurches(churches, { region: "경기" }).map((c) => c.id)).toEqual(
      ["새언약교회-김포시"],
    );
  });

  it("검색어와 지역은 함께 적용된다", () => {
    expect(filterChurches(churches, { q: "언약", region: "경기" })).toHaveLength(
      1,
    );
    expect(filterChurches(churches, { q: "한길", region: "경기" })).toEqual([]);
  });

  it("일치하는 교회가 없으면 빈 배열이다", () => {
    expect(filterChurches(churches, { q: "없는교회" })).toEqual([]);
  });

  it("교단 묶음으로 거른다", () => {
    expect(
      filterChurches(churches, { denominationGroup: "합신 계열" }).map(
        (c) => c.id,
      ),
    ).toEqual(["언약교회-강동구"]);
  });

  it("교단이 없는 교회는 어느 묶음에도 걸리지 않는다", () => {
    // `전체`에서만 보인다. `교단 없음` 칩을 만들지 않기로 한 결정과 짝이다
    const groups = ["합신 계열", "고신·고려 계열", "기타"];
    for (const denominationGroup of groups) {
      expect(
        filterChurches(churches, { denominationGroup }).map((c) => c.id),
      ).not.toContain("새언약교회-김포시");
    }
    expect(filterChurches(churches, {})).toHaveLength(3);
  });

  it("검색어·지역·교단이 함께 적용된다", () => {
    expect(
      filterChurches(churches, {
        q: "언약",
        region: "서울",
        denominationGroup: "합신 계열",
      }).map((c) => c.id),
    ).toEqual(["언약교회-강동구"]);
    // 지역은 맞지만 묶음이 다르면 걸러진다
    expect(
      filterChurches(churches, {
        region: "서울",
        denominationGroup: "대신 계열",
      }),
    ).toEqual([]);
  });
});

describe("collectDenominationGroups", () => {
  it("등장하는 묶음만 건수 내림차순으로 돌려준다", () => {
    // 표본은 1건씩이라 동수다. 순서가 아니라 구성만 본다
    expect(collectDenominationGroups(churches).sort()).toEqual(
      ["고신·고려 계열", "합신 계열"].sort(),
    );
  });

  it("교단이 없는 교회는 세지 않는다 — `교단 없음` 칩을 만들지 않기 위해서다", () => {
    expect(collectDenominationGroups(churches)).toHaveLength(2);
    expect(collectDenominationGroups(churches)).not.toContain(undefined);
  });

  it("건수 내림차순이다", () => {
    const many = [
      ...churches,
      { ...churches[1], id: "다른교회-성북구" },
      { ...churches[1], id: "또다른교회-성북구" },
    ];
    expect(collectDenominationGroups(many)[0]).toBe("고신·고려 계열");
  });

  it("빈 목록에는 빈 배열이다", () => {
    expect(collectDenominationGroups([])).toEqual([]);
  });
});

describe("collectRegions", () => {
  it("등장하는 지역만 건수 내림차순으로 돌려준다", () => {
    expect(collectRegions(churches)).toEqual(["서울", "경기"]);
  });

  it("빈 목록에는 빈 배열이다", () => {
    expect(collectRegions([])).toEqual([]);
  });
});

describe("collectRegionCounts", () => {
  it("지역과 건수를 함께 내림차순으로 돌려준다", () => {
    expect(collectRegionCounts(churches)).toEqual([
      { region: "서울", count: 2 },
      { region: "경기", count: 1 },
    ]);
  });

  it("건수 합계는 원본 건수와 같다 — 홈의 `그 외 지역` 계산이 이 성질에 기댄다", () => {
    const total = collectRegionCounts(churches).reduce(
      (sum, { count }) => sum + count,
      0,
    );
    expect(total).toBe(churches.length);
  });
});
