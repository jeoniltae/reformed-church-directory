// hook-input.mts 단위 테스트
//
// 훅이 헛울리거나 조용히 통과하는 경우가 둘 다 나쁘다.
// 헛울리면 사람이 훅을 꺼 버리고, 조용히 통과하면 막을 이유가 없어진다.

import { describe, expect, it } from "vitest";
import { extractNewContent, isUnderDataDir } from "./hook-input.mts";

const ROOT = "/repo";

describe("extractNewContent", () => {
  it("Write의 content를 꺼낸다", () => {
    expect(extractNewContent({ file_path: "data/a.json", content: "새 내용" })).toEqual([
      "새 내용",
    ]);
  });

  it("Edit의 new_string을 꺼낸다", () => {
    expect(
      extractNewContent({ file_path: "data/a.json", old_string: "옛", new_string: "새" }),
    ).toEqual(["새"]);
  });

  // 이걸 빠뜨리면 이미 들어간 민감정보를 지우는 편집이 막힌다 — 고치려는 사람을 막는 꼴이다
  it("old_string은 보지 않는다", () => {
    expect(
      extractNewContent({ old_string: "900101-1234567", new_string: "" }),
    ).toEqual([]);
  });

  it("여러 편집의 new_string을 모두 모은다", () => {
    expect(
      extractNewContent({
        file_path: "data/a.json",
        edits: [
          { old_string: "가", new_string: "나" },
          { old_string: "다", new_string: "라" },
        ],
      }),
    ).toEqual(["나", "라"]);
  });

  // 도구가 바뀌어 아는 키가 사라지면 조용히 통과시키지 않고 나머지를 훑는다
  it("아는 키가 없으면 경로를 뺀 나머지를 훑는다", () => {
    expect(
      extractNewContent({ file_path: "data/a.json", 알수없는필드: "값" }),
    ).toEqual(["값"]);
  });

  it("빈 문자열은 담지 않는다", () => {
    expect(extractNewContent({ content: "" })).toEqual([]);
  });
});

describe("isUnderDataDir", () => {
  it("상대 경로를 알아본다", () => {
    expect(isUnderDataDir(ROOT, "data/churches.json")).toBe(true);
    expect(isUnderDataDir(ROOT, "data/raw/추천교회.CSV")).toBe(true);
  });

  it("절대 경로를 알아본다", () => {
    expect(isUnderDataDir(ROOT, "/repo/data/notices.json")).toBe(true);
  });

  // 소스 코드까지 검사하면 정규식 상수나 테스트 픽스처에서 헛울린다
  it("data/ 밖은 보지 않는다", () => {
    expect(isUnderDataDir(ROOT, "src/lib/church-utils.ts")).toBe(false);
    expect(isUnderDataDir(ROOT, "scripts/lib/sensitive.test.ts")).toBe(false);
    expect(isUnderDataDir(ROOT, "/repo/package.json")).toBe(false);
  });

  it("이름이 data로 시작할 뿐인 폴더를 data/로 보지 않는다", () => {
    expect(isUnderDataDir(ROOT, "database/x.json")).toBe(false);
  });

  it("저장소 밖은 보지 않는다", () => {
    expect(isUnderDataDir(ROOT, "/etc/passwd")).toBe(false);
    expect(isUnderDataDir(ROOT, "../data/x.json")).toBe(false);
  });

  it("경로가 없으면 false다", () => {
    expect(isUnderDataDir(ROOT, undefined)).toBe(false);
    expect(isUnderDataDir(ROOT, "")).toBe(false);
    expect(isUnderDataDir(ROOT, 42)).toBe(false);
  });
});
