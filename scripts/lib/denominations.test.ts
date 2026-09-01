// denominations.mts 단위 테스트
//
// 픽스처로 동작을 고정한다. 실제 data/denominations.json과 맞는지는
// import:source의 "교단 표기 미등록" 경고가 매 실행마다 확인한다.

import { describe, expect, it } from "vitest";
import {
  buildDenominationIndex,
  type DenominationTable,
  normalizeDenomination,
} from "./denominations.mts";

const TABLE: DenominationTable = {
  groups: ["합신 계열", "대신 계열", "고신·고려 계열", "독립·해외", "기타"],
  entries: [
    { raw: "합신", short: "합신", group: "합신 계열" },
    // 표기가 합쳐지는 값 — 원본은 다른데 같은 교단이다
    { raw: "대신", short: "대신", group: "대신 계열" },
    { raw: "대신수호", short: "대신", group: "대신 계열" },
    { raw: "고려연합", short: "고려", group: "고신·고려 계열" },
    // 한 raw 값이 서로 다른 교단을 가리키는 경우
    {
      raw: "독립",
      short: "독립",
      group: "독립·해외",
      perChurch: [
        { id: "합정동교회-마포구", short: "독립(근본노회)", group: "독립·해외" },
        { id: "선실교회-의왕시", short: "", group: "" },
      ],
    },
    { raw: "개혁", short: "개혁", group: "기타" },
  ],
};

const index = buildDenominationIndex(TABLE);
const run = (raw: string, id = "무관한교회-어딘가") =>
  normalizeDenomination(raw, id, index);

describe("normalizeDenomination", () => {
  it("표에 있는 값을 정규화한다", () => {
    expect(run("합신")).toEqual({
      denomination: "합신",
      denominationGroup: "합신 계열",
    });
  });

  it("서로 다른 표기가 같은 값으로 합쳐진다", () => {
    expect(run("대신")?.denomination).toBe("대신");
    expect(run("대신수호")?.denomination).toBe("대신");
  });

  it("원본과 다른 이름으로 바뀐다", () => {
    expect(run("고려연합")).toEqual({
      denomination: "고려",
      denominationGroup: "고신·고려 계열",
    });
  });

  it("앞뒤 공백을 무시한다", () => {
    expect(run("  합신  ")?.denomination).toBe("합신");
  });

  // 확장 대비 — 여기가 이 함수에서 가장 중요한 동작이다
  it("표에 없는 값은 undefined — 조용히 비우거나 임의로 묶지 않는다", () => {
    expect(run("백석")).toBeUndefined();
    expect(run("예장고신")).toBeUndefined();
  });

  it("빈 값은 undefined — 교단이 없는 교회다", () => {
    expect(run("")).toBeUndefined();
    expect(run("   ")).toBeUndefined();
  });
});

describe("normalizeDenomination — perChurch", () => {
  it("해당 교회만 다른 값을 받는다", () => {
    expect(run("독립", "합정동교회-마포구")).toEqual({
      denomination: "독립(근본노회)",
      denominationGroup: "독립·해외",
    });
  });

  it("같은 raw의 다른 교회는 행 값을 그대로 받는다", () => {
    expect(run("독립", "다른교회-어딘가")).toEqual({
      denomination: "독립",
      denominationGroup: "독립·해외",
    });
  });

  it("override의 빈 값은 행 값으로 돌아간다 — 빈 문자열은 `교정 없음`이다", () => {
    expect(run("독립", "선실교회-의왕시")).toEqual({
      denomination: "독립",
      denominationGroup: "독립·해외",
    });
  });

  it("perChurch가 없는 행에서도 id는 무해하다", () => {
    expect(run("합신", "아무교회-아무데")?.denomination).toBe("합신");
  });
});

describe("normalizeDenomination — group이 비었을 때", () => {
  const noGroup = buildDenominationIndex({
    groups: [],
    entries: [{ raw: "미분류", short: "미분류", group: "" }],
  });

  it("denominationGroup 키를 아예 넣지 않는다 — 빈 문자열은 `값이 있는데 비어 있다`로 읽힌다", () => {
    const r = normalizeDenomination("미분류", "x", noGroup);
    expect(r).toEqual({ denomination: "미분류" });
    expect(r && "denominationGroup" in r).toBe(false);
  });
});
