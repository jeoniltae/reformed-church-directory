// updated-dates.mts 단위 테스트
//
// **날짜가 움직이지 말아야 할 경우를 고정한다.** 화면에 나가는 `최종 수정`은 사실 정보가
// 바뀐 날이어야 하고, 일괄 재분류나 좌표 재조회로 움직이면 그 말이 거짓이 된다.

import { describe, expect, it } from "vitest";
import type { Church } from "../../src/types/church.ts";
import { stampUpdatedDates } from "./updated-dates.mts";

const TODAY = "2026-11-05";
const BEFORE = "2026-09-01";

function church(overrides: Partial<Church> = {}): Church {
  return {
    id: "언약교회-하남시",
    name: "언약교회",
    region: "경기",
    address: "경기도 하남시 하남대로 412",
    pastor: "김목사",
    source: "자체 수집",
    ...overrides,
  };
}

const ledger = { "언약교회-하남시": BEFORE };

describe("stampUpdatedDates", () => {
  it("값이 그대로면 원장 날짜를 유지한다", () => {
    expect(stampUpdatedDates([church()], [church()], ledger, TODAY)).toEqual(ledger);
  });

  it.each([
    ["name", { name: "새언약교회" }],
    ["address", { address: "경기도 하남시 다른로 1" }],
    ["phone", { phone: "031-000-0000" }],
    ["pastor", { pastor: "이목사" }],
    ["homepage", { homepage: "https://example.org" }],
    ["denomination", { denomination: "합신" }],
  ])("사실 필드 %s가 바뀌면 오늘 날짜를 받는다", (_field, change) => {
    expect(stampUpdatedDates([church()], [church(change)], ledger, TODAY)).toEqual({
      "언약교회-하남시": TODAY,
    });
  });

  it("사실 필드가 지워져도 변경으로 본다", () => {
    const before = church({ homepage: "https://example.org" });
    expect(stampUpdatedDates([before], [church()], ledger, TODAY)).toEqual({
      "언약교회-하남시": TODAY,
    });
  });

  it("좌표·교단 묶음·안내만 바뀌면 날짜가 그대로다", () => {
    const after = church({
      lat: 37.5,
      lng: 127.2,
      denominationGroup: "합신 계열",
      notice: { message: "주소를 확인하지 못했습니다." },
    });
    expect(stampUpdatedDates([church()], [after], ledger, TODAY)).toEqual(ledger);
  });

  it("없는 값과 빈 문자열은 같은 값으로 본다", () => {
    expect(stampUpdatedDates([church()], [church({ phone: "" })], ledger, TODAY)).toEqual(ledger);
  });

  it("바뀐 교회만 날짜가 움직인다", () => {
    const other = church({ id: "은혜교회-강동구", name: "은혜교회" });
    const dates = { ...ledger, [other.id]: "2026-10-19" };
    expect(
      stampUpdatedDates([church(), other], [church({ pastor: "이목사" }), other], dates, TODAY),
    ).toEqual({ "언약교회-하남시": TODAY, "은혜교회-강동구": "2026-10-19" });
  });

  it("원장에 없는 id는 오늘 날짜를 받는다", () => {
    const added = church({ id: "은혜교회-강동구", name: "은혜교회" });
    expect(stampUpdatedDates([church()], [church(), added], ledger, TODAY)).toEqual({
      ...ledger,
      "은혜교회-강동구": TODAY,
    });
  });

  it("결과에 없는 id의 행은 사라진다", () => {
    const renamed = church({ id: "새언약교회-하남시", name: "새언약교회" });
    expect(stampUpdatedDates([church()], [renamed], ledger, TODAY)).toEqual({
      "새언약교회-하남시": TODAY,
    });
  });

  it("이전 데이터가 없으면 비교하지 않고 원장 값을 유지한다", () => {
    const added = church({ id: "은혜교회-강동구", name: "은혜교회" });
    expect(stampUpdatedDates(null, [church(), added], ledger, TODAY)).toEqual({
      ...ledger,
      "은혜교회-강동구": TODAY,
    });
  });

  it("결과 순서대로 키를 만든다 — 재실행해도 원장 diff가 없어야 한다", () => {
    const other = church({ id: "은혜교회-강동구", name: "은혜교회" });
    const shuffled = { [other.id]: BEFORE, ...ledger };
    const result = stampUpdatedDates(null, [church(), other], shuffled, TODAY);
    expect(Object.keys(result)).toEqual([church().id, other.id]);
  });
});
