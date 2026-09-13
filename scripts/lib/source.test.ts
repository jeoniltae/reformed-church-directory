// source.mts 단위 테스트
//
// 픽스처로 동작을 고정한다. 실제 CSV·additions와 맞는지는 import:source의
// 집계 출력이 매 실행마다 확인한다.
//
// **여기서 지키려는 것은 id다.** id가 상세 페이지 URL이라 한 번 틀리면
// 색인된 주소가 깨지고, 틀려도 빌드는 통과한다.

import { describe, expect, it } from "vitest";
import {
  type AdditionRow,
  buildRows,
  type Fix,
  parseCsv,
} from "./source.mts";

const HEADER = [
  "지역",
  "sub-지역",
  "교회명",
  "담임목사",
  "교단",
  "전화번호",
  "주소",
  "홈페이지",
  "비고",
];

const CSV_BODY: string[][] = [
  [
    "서울시",
    "강동구",
    "언약교회",
    "최현진",
    "합신",
    "02-428-3578",
    "서울시 강동구 강일동 69",
    "http://www.cvtchurch.org/",
    "비고는 읽지 않는다",
  ],
  // 같은 이름 + 같은 시군구 — 충돌 카운터가 걸리는 유일한 조건이다
  ["경기도", "하남시", "사랑교회", "김목사", "고신", "031-111-1111", "경기도 하남시 대로 1", "", ""],
  ["경기도", "하남시", "사랑교회", "이목사", "합신", "031-222-2222", "경기도 하남시 대로 2", "", ""],
];

const run = (
  additions: AdditionRow[] = [],
  fixes: Fix[] = [],
  body: string[][] = CSV_BODY,
) =>
  buildRows({
    header: HEADER,
    body,
    additions,
    fixes: new Map(fixes.map((f) => [f.id, f])),
  });

const addition = (over: Partial<AdditionRow> = {}): AdditionRow => ({
  region: "부산광역시",
  subRegion: "해운대구",
  name: "새교회",
  pastor: "박목사",
  denomination: "고신",
  phone: "051-333-3333",
  address: "부산광역시 해운대구 길 3",
  homepage: "",
  ...over,
});

describe("parseCsv", () => {
  it("따옴표 안의 쉼표를 필드 구분자로 보지 않는다", () => {
    expect(parseCsv('a,"b,c",d')).toEqual([["a", "b,c", "d"]]);
  });

  it("이스케이프된 따옴표를 한 글자로 되돌린다", () => {
    expect(parseCsv('a,"b""c"')).toEqual([["a", 'b"c']]);
  });

  it("CRLF 줄바꿈을 처리한다", () => {
    expect(parseCsv("a,b\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("마지막 줄에 개행이 없어도 버리지 않는다", () => {
    expect(parseCsv("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });
});

describe("buildRows — CSV 행", () => {
  it("헤더 이름으로 열을 찾아 정규화한다", () => {
    const { rows } = run();
    expect(rows[0]).toMatchObject({
      id: "언약교회-강동구",
      name: "언약교회",
      region: "서울", // 서울시 → 서울
      subRegion: "강동구",
      rawAddress: "서울시 강동구 강일동 69",
      pastor: "최현진",
      denomination: "합신", // 교단 판정은 import-source가 한다
      phone: "02-428-3578",
      homepage: "http://www.cvtchurch.org/",
      homepageCorrected: "",
    });
  });

  it("화이트리스트 밖의 열(비고)은 SourceRow에 실리지 않는다", () => {
    const { rows } = run();
    expect(Object.values(rows[0])).not.toContain("비고는 읽지 않는다");
  });

  it("교회명과 시군구가 겹치면 두 번째부터 번호를 붙인다", () => {
    const { rows } = run();
    expect(rows.map((r) => r.id)).toEqual([
      "언약교회-강동구",
      "사랑교회-하남시",
      "사랑교회-하남시-2",
    ]);
  });
});

describe("buildRows — 신규 등록(additions)", () => {
  it("CSV 행 뒤에 이어붙이고 건수를 돌려준다", () => {
    const { rows, addedCount } = run([addition()]);
    expect(addedCount).toBe(1);
    expect(rows).toHaveLength(4);
    expect(rows[3]).toMatchObject({
      id: "새교회-해운대구",
      region: "부산",
      rawAddress: "부산광역시 해운대구 길 3",
    });
  });

  // **이 순서가 뒤집히면 이미 색인된 상세 URL이 바뀐다.**
  // 신규 등록이 앞에 끼면 -2가 기존 교회 쪽에 붙는다.
  it("이름이 겹쳐도 번호는 신규 등록 쪽에 붙는다", () => {
    const { rows } = run([addition({ name: "사랑교회", subRegion: "하남시" })]);
    expect(rows.map((r) => r.id)).toEqual([
      "언약교회-강동구",
      "사랑교회-하남시",
      "사랑교회-하남시-2",
      "사랑교회-하남시-3",
    ]);
  });

  it("앞뒤 공백과 겹친 공백을 정리한다", () => {
    const { rows } = run([
      addition({ name: "  새교회 ", address: "  부산광역시 해운대구  길 3  " }),
    ]);
    expect(rows[3].id).toBe("새교회-해운대구");
    expect(rows[3].rawAddress).toBe("부산광역시 해운대구 길 3");
  });

  it("homepage가 없어도 빈 문자열로 채운다", () => {
    const { rows } = run([addition({ homepage: undefined })]);
    expect(rows[3].homepage).toBe("");
  });
});

describe("buildRows — 사람 교정(address-fixes)", () => {
  it("번호가 붙은 id로 조회한다", () => {
    const { rows } = run([], [{ id: "사랑교회-하남시-2", phoneCorrected: "031-999-9999" }]);
    expect(rows[1].phone).toBe("031-111-1111"); // 첫 번째는 그대로
    expect(rows[2].phone).toBe("031-999-9999");
    expect(rows[2].fixed.phone).toBe(true);
  });

  it("빈 문자열은 교정으로 보지 않는다", () => {
    const { rows } = run([], [{ id: "언약교회-강동구", pastorCorrected: "   " }]);
    expect(rows[0].pastor).toBe("최현진");
    expect(rows[0].fixed.pastor).toBe(false);
  });

  // 조회 키는 **원본 값으로 만든 id**이고 출력 id는 교정 뒤 값으로 다시 만들어진다.
  // 이 둘을 헷갈리면 교정이 조용히 무시된다.
  it("교회명을 고치면 출력 id가 바뀐다 — 조회 키는 원본 id 그대로다", () => {
    const { rows } = run([], [{ id: "언약교회-강동구", nameCorrected: "새언약교회" }]);
    expect(rows[0].id).toBe("새언약교회-강동구");
    expect(rows[0].name).toBe("새언약교회");
    expect(rows[0].fixed.name).toBe(true);
  });

  it("시군구를 고치면 출력 id가 바뀐다", () => {
    const { rows } = run([], [{ id: "언약교회-강동구", subRegionCorrected: "하남시" }]);
    expect(rows[0].id).toBe("언약교회-하남시");
    expect(rows[0].subRegion).toBe("하남시");
  });

  it("시도를 고쳐도 id는 그대로다", () => {
    const { rows } = run([], [{ id: "언약교회-강동구", regionCorrected: "경기도" }]);
    expect(rows[0].id).toBe("언약교회-강동구");
    expect(rows[0].region).toBe("경기");
  });

  it("이전한 홈페이지는 원본을 덮지 않고 따로 담긴다", () => {
    const { rows } = run(
      [],
      [{ id: "언약교회-강동구", homepageCorrected: "https://new.example.com/" }],
    );
    // 원본이 죽었다는 판정은 이 값으로 해야 한다 — import-source가 순서를 지킨다
    expect(rows[0].homepage).toBe("http://www.cvtchurch.org/");
    expect(rows[0].homepageCorrected).toBe("https://new.example.com/");
  });

  it("신규 등록 행에도 똑같이 걸린다", () => {
    const { rows } = run([addition()], [{ id: "새교회-해운대구", corrected: "부산 해운대구 우동 1" }]);
    expect(rows[3].rawAddress).toBe("부산 해운대구 우동 1");
    expect(rows[3].fixed.address).toBe(true);
  });
});

describe("buildRows — id 중복", () => {
  // 교정으로 만들어진 id는 충돌 카운터를 거치지 않는다. 막지 않으면
  // 두 교회가 같은 URL을 갖게 되어 상세 페이지 하나가 사라진다.
  it("교정이 기존 id와 충돌하면 던진다", () => {
    expect(() =>
      run([], [{ id: "사랑교회-하남시-2", nameCorrected: "사랑교회", subRegionCorrected: "하남시" }]),
    ).toThrow(/id 중복/);
  });

  it("신규 등록이 기존 id와 충돌해도 던진다", () => {
    expect(() =>
      run(
        [addition({ name: "언약교회", subRegion: "강동구" })],
        [{ id: "언약교회-강동구-2", nameCorrected: "언약교회", subRegionCorrected: "강동구" }],
      ),
    ).toThrow(/id 중복/);
  });
});
