// 교회 검색·필터 단위 테스트 — 실제 보유 데이터의 표기를 본떠 최소 표본을 만든다

import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import { collectRegions, filterChurches } from "./search";

const churches: Church[] = [
  {
    id: "언약교회-강동구",
    name: "언약교회",
    region: "서울",
    subRegion: "강동구",
    address: "서울 강동구 강일동 69",
    pastor: "이승구",
    denomination: "합신",
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
    source: "자체 수집",
  },
  {
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
});

describe("collectRegions", () => {
  it("등장하는 지역만 건수 내림차순으로 돌려준다", () => {
    expect(collectRegions(churches)).toEqual(["서울", "경기"]);
  });

  it("빈 목록에는 빈 배열이다", () => {
    expect(collectRegions([])).toEqual([]);
  });
});
