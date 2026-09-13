// church-edit.mts 단위 테스트
//
// 여기서 지키려는 것 둘.
//  1) **교정의 키는 lookupId다.** 출력 id를 쓰면 개명·이전한 교회에서 조용히 빗나간다.
//  2) **최상위 설명 키(note·fields·주의)를 잃지 않는다.** 그 설명이 파일의 사용법이다.

import { describe, expect, it } from "vitest";
import {
  type AddressFixesDoc,
  type AdditionsDoc,
  appendAddition,
  appendExclusion,
  type ExcludedDoc,
  idChangeChecklist,
  type NoticesDoc,
  resolveTarget,
  serialize,
  upsertFix,
  upsertNotice,
} from "./church-edit.mts";
import type { SourceRow } from "./source.mts";

const row = (over: Partial<SourceRow> = {}): SourceRow => ({
  id: "언약교회-하남시",
  lookupId: "언약교회-강동구", // 이전해서 둘이 다르다 — 실제 데이터에 있는 상황이다
  name: "언약교회",
  region: "경기",
  subRegion: "하남시",
  rawAddress: "경기 하남시 하남대로 412",
  pastor: "최현진",
  denomination: "합신",
  phone: "02-428-3578",
  homepage: "http://www.cvtchurch.org/",
  homepageCorrected: "",
  fixed: {
    address: false,
    phone: false,
    pastor: false,
    homepage: false,
    name: false,
    subRegion: false,
    region: false,
  },
  ...over,
});

const ROWS: SourceRow[] = [
  row(),
  row({ id: "사랑교회-서초구", lookupId: "사랑교회-서초구", name: "사랑교회" }),
  row({ id: "사랑의교회-서초구", lookupId: "사랑의교회-서초구", name: "사랑의교회" }),
];

describe("resolveTarget", () => {
  it("출력 id로 찾는다", () => {
    expect(resolveTarget(ROWS, "언약교회-하남시")).toEqual({ status: "ok", row: ROWS[0] });
  });

  // 이전한 교회를 옛 id로 찾는 경우다. 이게 안 되면 교정 이력을 못 따라간다.
  it("조회용 id로도 찾는다", () => {
    expect(resolveTarget(ROWS, "언약교회-강동구")).toEqual({ status: "ok", row: ROWS[0] });
  });

  // 부분 일치를 먼저 보면 `사랑교회`가 `사랑의교회`까지 끌고 와 후보가 둘이 된다.
  it("이름이 정확히 맞으면 부분 일치 후보에 밀리지 않는다", () => {
    expect(resolveTarget(ROWS, "사랑교회")).toEqual({ status: "ok", row: ROWS[1] });
  });

  it("부분 일치로 하나만 남으면 그것을 고른다", () => {
    expect(resolveTarget(ROWS, "언약")).toEqual({ status: "ok", row: ROWS[0] });
  });

  it("부분 일치 후보가 여럿이면 고르지 않고 목록을 돌려준다", () => {
    expect(resolveTarget(ROWS, "교회")).toEqual({
      status: "ambiguous",
      matches: ROWS,
    });
  });

  it("없으면 notFound다", () => {
    expect(resolveTarget(ROWS, "없는교회")).toEqual({ status: "notFound" });
  });

  it("빈 검색어로 아무거나 고르지 않는다", () => {
    expect(resolveTarget(ROWS, "   ")).toEqual({ status: "notFound" });
  });
});

describe("upsertFix", () => {
  const doc = (): AddressFixesDoc => ({
    note: "사람이 확인해 교정한 값.",
    fields: { corrected: "교정한 주소" },
    fixes: [
      { id: "언약교회-강동구", church: "언약교회", original: "서울시 강동구 강일동 69", corrected: "경기 하남시 하남대로 412" },
    ],
  });

  it("새 행을 만들 때 키 순서를 fields 설명과 맞춘다", () => {
    const out = upsertFix(doc(), "사랑교회-서초구", {
      church: "사랑교회",
      note: "제보 #12",
      phoneCorrected: "02-111-2222",
    });
    expect(Object.keys(out.fixes[1])).toEqual(["id", "church", "phoneCorrected", "note"]);
  });

  it("기존 행은 키 순서를 그대로 두고 값만 덮는다", () => {
    const out = upsertFix(doc(), "언약교회-강동구", { corrected: "경기 하남시 하남대로 999" });
    expect(out.fixes).toHaveLength(1);
    expect(Object.keys(out.fixes[0])).toEqual(["id", "church", "original", "corrected"]);
    expect(out.fixes[0].corrected).toBe("경기 하남시 하남대로 999");
  });

  it("최상위 설명 키를 잃지 않는다", () => {
    const out = upsertFix(doc(), "새교회-어딘가", { corrected: "어딘가 1" });
    expect(out.note).toBe("사람이 확인해 교정한 값.");
    expect(out.fields).toEqual({ corrected: "교정한 주소" });
  });

  it("undefined는 쓰지 않고, 빈 문자열은 교정 해제로 그대로 쓴다", () => {
    const out = upsertFix(doc(), "언약교회-강동구", {
      phoneCorrected: undefined,
      corrected: "",
    });
    expect(out.fixes[0]).not.toHaveProperty("phoneCorrected");
    expect(out.fixes[0].corrected).toBe("");
  });

  it("원본 문서를 건드리지 않는다", () => {
    const original = doc();
    upsertFix(original, "언약교회-강동구", { corrected: "바뀐 주소" });
    expect(original.fixes[0].corrected).toBe("경기 하남시 하남대로 412");
  });
});

describe("appendAddition", () => {
  const doc = (): AdditionsDoc => ({ note: "신규 등록", churches: [] });

  it("뒤에 붙이고 설명 키를 지킨다", () => {
    const out = appendAddition(doc(), {
      region: "부산광역시",
      subRegion: "해운대구",
      name: "새교회",
      pastor: "박목사",
      denomination: "고신",
      phone: "051-000-0000",
      address: "부산광역시 해운대구 좌동순환로 100",
      addedAt: "2026-09-13",
    });
    expect(out.churches).toHaveLength(1);
    expect(out.churches[0].name).toBe("새교회");
    expect(out.note).toBe("신규 등록");
  });

  it("원본 문서를 건드리지 않는다", () => {
    const original = doc();
    appendAddition(original, { region: "서울시", subRegion: "강남구", name: "가", pastor: "", denomination: "", phone: "", address: "" });
    expect(original.churches).toHaveLength(0);
  });
});

describe("appendExclusion", () => {
  const doc = (): ExcludedDoc => ({ note: "삭제 요청받은 교회", churches: [] });

  it("사유와 접수일을 함께 남긴다", () => {
    const out = appendExclusion(doc(), "새교회-해운대구", "본인 요청", "2026-09-13");
    expect(out.churches).toEqual([
      { id: "새교회-해운대구", reason: "본인 요청", requestedAt: "2026-09-13" },
    ]);
  });

  // 두 번 제외해도 결과는 같지만 목록이 지저분해지고 매칭 경고 집계가 어긋난다
  it("같은 id를 두 번 넣지 않고 덮어쓴다", () => {
    const once = appendExclusion(doc(), "가교회-어딘가", "첫 사유", "2026-09-13");
    const twice = appendExclusion(once, "가교회-어딘가", "고친 사유", "2026-09-14");
    expect(twice.churches).toHaveLength(1);
    expect(twice.churches[0].reason).toBe("고친 사유");
  });
});

describe("upsertNotice", () => {
  const doc = (): NoticesDoc => ({ note: "알려진 한계", 주의: "제3자 번호 주의", notices: [] });

  it("새 안내를 더한다", () => {
    const out = upsertNotice(doc(), { id: "가교회-어딘가", message: "주소를 확인하지 못했습니다." });
    expect(out.notices).toHaveLength(1);
    expect(out["주의"]).toBe("제3자 번호 주의");
  });

  it("같은 id면 덮어쓴다", () => {
    const once = upsertNotice(doc(), { id: "가교회-어딘가", message: "첫 문구" });
    const twice = upsertNotice(once, { id: "가교회-어딘가", message: "고친 문구" });
    expect(twice.notices).toHaveLength(1);
    expect(twice.notices[0].message).toBe("고친 문구");
  });
});

describe("idChangeChecklist", () => {
  const lines = idChangeChecklist("언약교회-강동구", "언약교회-하남시").join("\n");

  // 한글 원문을 쓰면 빌드는 통과하고 404만 남는다 — 실제로 그렇게 만들어진 적이 있다
  it("리다이렉트 source를 퍼센트 인코딩해서 내놓는다", () => {
    expect(lines).toContain(
      'source: "/churches/%EC%96%B8%EC%95%BD%EA%B5%90%ED%9A%8C-%EA%B0%95%EB%8F%99%EA%B5%AC"',
    );
  });

  it("destination도 인코딩한다 — 기존 next.config.ts와 같은 형식이다", () => {
    expect(lines).toContain(
      'destination: "/churches/%EC%96%B8%EC%95%BD%EA%B5%90%ED%9A%8C-%ED%95%98%EB%82%A8%EC%8B%9C"',
    );
  });

  it("id가 키인 파일 세 곳을 빠짐없이 짚는다", () => {
    expect(lines).toContain("data/geocode.json");
    expect(lines).toContain("data/notices.json");
    expect(lines).toContain("data/excluded.json");
  });

  it("공개일 이전 id는 리다이렉트가 필요 없다고 알린다", () => {
    expect(lines).toContain("2026-09-06");
  });
});

describe("serialize", () => {
  it("들여쓰기 2에 끝 개행 — 기존 데이터 파일과 같은 모양이다", () => {
    expect(serialize({ a: 1 })).toBe('{\n  "a": 1\n}\n');
  });
});
