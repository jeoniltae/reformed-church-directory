import { describe, expect, it } from "vitest";
import { addressKey, pickByChurchName, pickExactMatch } from "./address-match.mts";

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

describe("pickByChurchName", () => {
  // 신반포중앙교회 — 주소로는 못 가른다. `잠원동 60-3`이 건물명 없이 두 번 나와서
  // pickExactMatch는 여기서 null이다. 건물명에 교회 이름이 박힌 후보가 답이다.
  const 신반포 = [
    { roadAddr: "서울특별시 서초구 신반포로 251 (잠원동)", jibunAddr: "서울특별시 서초구 잠원동 60-3" },
    { roadAddr: "서울특별시 서초구 신반포로 251 (잠원동, 메이플 자이 1단지)", jibunAddr: "서울특별시 서초구 잠원동 60-3 메이플 자이 1단지" },
    { roadAddr: "서울특별시 서초구 신반포로 253 (잠원동, 메이플 자이 2단지)", jibunAddr: "서울특별시 서초구 잠원동 60-3 메이플 자이 2단지" },
    { roadAddr: "서울특별시 서초구 신반포로 255 (잠원동)", jibunAddr: "서울특별시 서초구 잠원동 60-3 신반포중앙교회" },
    { roadAddr: "서울특별시 서초구 잠원로4길 34 (잠원동)", jibunAddr: "서울특별시 서초구 잠원동 60-3" },
  ];

  it("건물명이 교회명인 후보를 찾아낸다", () => {
    expect(pickByChurchName("신반포중앙교회", 신반포)).toBe(신반포[3]);
  });

  it("주소로는 갈리지 않는 경우다 — 두 규칙이 서로를 보완한다", () => {
    expect(pickExactMatch("서울시 서초구 잠원동 60-3", 신반포)).toBeNull();
  });

  it("도로명이 교회명과 겹쳐도 오작동하지 않는다", () => {
    // `신반포로`가 교회명 앞부분과 겹치지만 이름 전체를 담은 건물은 하나뿐이다
    expect(pickByChurchName("신반포중앙교회", 신반포)?.jibunAddr).toContain("신반포중앙교회");
  });

  it("건물명에 교회명이 없으면 고르지 않는다", () => {
    const candidates = [
      { roadAddr: "경기도 용인시 수지구 동천로63번길 10 (동천동, 동천마을현대2차홈타운)", jibunAddr: "경기도 용인시 수지구 동천동 862 동천마을현대2차홈타운" },
      { roadAddr: "경기도 용인시 수지구 동천로63번길 12 (동천동)", jibunAddr: "경기도 용인시 수지구 동천동 862 현대2차홈타운" },
    ];
    expect(pickByChurchName("하늘마을장로교회", candidates)).toBeNull();
  });

  it("이름이 여러 후보에 걸리면 고르지 않는다", () => {
    const candidates = [
      { roadAddr: "가로 1", jibunAddr: "가동 1 은혜교회" },
      { roadAddr: "가로 3", jibunAddr: "가동 3 은혜교회 별관" },
    ];
    expect(pickByChurchName("은혜교회", candidates)).toBeNull();
  });

  it("두 글자 이하 이름으로는 시도하지 않는다", () => {
    expect(pickByChurchName("한", [{ roadAddr: "가로 1", jibunAddr: "가동 1 한빛빌딩" }])).toBeNull();
  });
});
