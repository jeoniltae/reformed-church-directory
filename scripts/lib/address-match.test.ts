import { describe, expect, it } from "vitest";
import { addressKey, pickExactMatch } from "./address-match.mts";

// 아래 후보 목록은 전부 도로명주소 검색 API의 실제 응답이다 (2026-09-07 조회).
// 손으로 지어낸 값이 아니므로 API 표기 습관(시도 정식명, 도로명 붙여쓰기)이 그대로 들어 있다.

describe("addressKey", () => {
  it("시도 표기 차이를 흡수한다", () => {
    // 보유 데이터는 `경남`, API는 `경상남도`로 같은 곳을 가리킨다
    expect(addressKey("경남 창원시 의창구 사림로 130번길 10-12")).toBe(
      addressKey("경상남도 창원시 의창구 사림로130번길 10-12 (사림동)"),
    );
    expect(addressKey("서울시 마포구 현석동 220")).toBe(
      addressKey("서울특별시 마포구 현석동 220 밤섬현대아파트"),
    );
  });

  it("도로명 띄어쓰기 차이를 흡수한다", () => {
    // 보유 데이터는 `사림로 130번길`, API는 `사림로130번길`로 쓴다
    expect(addressKey("경남 창원시 의창구 사림로 130번길 10-12")).toBe(
      "경남창원시의창구사림로130번길10-12",
    );
  });

  it("건물명·층·호는 키에 들어가지 않는다", () => {
    expect(addressKey("서울시 마포구 현석동 220 밤섬현대아파트상가 2층")).toBe(
      addressKey("서울시 마포구 현석동 220"),
    );
  });

  it("부번이 다르면 다른 키다", () => {
    // 후보가 쏟아지는 주된 이유가 부번 변형이다. 여기서 갈리지 않으면 판정이 무의미하다
    expect(addressKey("서울 은평구 연서로35길 8")).not.toBe(
      addressKey("서울특별시 은평구 연서로35길 8-2 (불광동)"),
    );
  });
});

describe("pickExactMatch", () => {
  it("부번 변형 틈에서 정확히 일치하는 하나를 찾아낸다", () => {
    // 샘터교회 — 후보 15건이지만 `8`은 하나뿐이고 나머지는 `8-2`·`8-4`…다
    const candidates = [
      { roadAddr: "서울특별시 은평구 연서로35길 8 (불광동)", jibunAddr: "서울특별시 은평구 불광동 422-20" },
      { roadAddr: "서울특별시 은평구 연서로35길 8-2 (불광동)", jibunAddr: "서울특별시 은평구 불광동 422-18" },
      { roadAddr: "서울특별시 은평구 연서로35길 8-4 (불광동)", jibunAddr: "서울특별시 은평구 불광동 422-15" },
      { roadAddr: "서울특별시 은평구 연서로35길 8-5 (불광동)", jibunAddr: "서울특별시 은평구 불광동 421-15" },
    ];
    expect(pickExactMatch("서울 은평구 연서로35길 8", candidates)).toBe(candidates[0]);
  });

  it("원본이 지번이고 후보가 도로명이어도 지번 쪽으로 맞춘다", () => {
    // 합정동교회 — 보유 주소는 지번인데 후보는 도로명이 대표값이다
    const candidates = [
      { roadAddr: "서울특별시 마포구 독막로 26 (합정동)", jibunAddr: "서울특별시 마포구 합정동 364-1 합정동교회" },
      { roadAddr: "서울특별시 마포구 독막로 24 (합정동)", jibunAddr: "서울특별시 마포구 합정동 364-5" },
    ];
    expect(pickExactMatch("서울시 마포구 합정동 364-1", candidates)).toBe(candidates[0]);
  });

  it("안산푸른교회 — 후보 23건 중 본번 일치는 하나다", () => {
    const candidates = [
      { roadAddr: "경기도 안산시 단원구 와동로 103 (와동)", jibunAddr: "경기도 안산시 단원구 와동 115 푸른교회" },
      { roadAddr: "경기도 안산시 단원구 와동로 91 (와동)", jibunAddr: "경기도 안산시 단원구 와동 115-9" },
      { roadAddr: "경기도 안산시 단원구 와동로 93 (와동)", jibunAddr: "경기도 안산시 단원구 와동 115-8" },
      { roadAddr: "경기도 안산시 단원구 와동로 93-1 (와동)", jibunAddr: "경기도 안산시 단원구 와동 115-11" },
    ];
    expect(pickExactMatch("경기도 안산시 단원구 와동 115", candidates)).toBe(candidates[0]);
  });

  it("한 지번에 건물이 둘이면 고르지 않는다", () => {
    // 성가교회 — 후보 2건의 지번이 글자까지 똑같고 도로명만 19/23으로 갈린다.
    // 원본이 "밤섬현대아파트상가 2층"이라 상가동이 어느 쪽인지는 사람이 봐야 한다.
    // **1순위를 그냥 채택하는 방식이었다면 여기서 조용히 틀렸을 것이다.**
    const candidates = [
      { roadAddr: "서울특별시 마포구 신수로3길 19 (현석동)", jibunAddr: "서울특별시 마포구 현석동 220 밤섬현대아파트" },
      { roadAddr: "서울특별시 마포구 신수로3길 23 (현석동, 밤섬현대아파트)", jibunAddr: "서울특별시 마포구 현석동 220 밤섬현대아파트" },
    ];
    expect(
      pickExactMatch("서울시 마포구 현석동 220 밤섬현대아파트상가 2층", candidates),
    ).toBeNull();
  });

  it("일치하는 후보가 없으면 고르지 않는다", () => {
    const candidates = [
      { roadAddr: "서울특별시 은평구 연서로35길 8-2 (불광동)", jibunAddr: "서울특별시 은평구 불광동 422-18" },
    ];
    expect(pickExactMatch("서울 은평구 연서로35길 8", candidates)).toBeNull();
  });

  it("빈 주소로는 아무것도 고르지 않는다", () => {
    expect(pickExactMatch("", [{ roadAddr: "서울특별시 은평구 연서로35길 8", jibunAddr: "" }])).toBeNull();
  });
});
