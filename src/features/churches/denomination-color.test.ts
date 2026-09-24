// 모노그램 색 단위 테스트 — **묶음이 늘었는데 색을 안 준 경우**를 잡는 것이 주 목적이다

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import { coloredGroups, monogramClass } from "./denomination-color";
import { EXCLUDED_GROUP, landingGroups } from "./landing";

const churches: Church[] = JSON.parse(
  readFileSync("data/churches.json", "utf8"),
);

describe("monogramClass", () => {
  it("교단 표기가 없으면 회색이다", () => {
    expect(monogramClass(undefined)).toBe("bg-muted text-muted-foreground");
  });

  /*
    ⚠️ **`기타`는 판정 실패가 아니다** — `CLAUDE.md`가 "상당수가 교단이 확정된 소규모
    독자 총회"라고 적어 뒀다. 색을 나눌 **하나의 계열이 아니라서** 비우는 것이지,
    모른다는 표시가 아니다. 색을 주는 순간 그 뜻이 뒤집힌다.
  */
  it("`기타`는 색을 주지 않는다 — 분류 실패라서가 아니다", () => {
    expect(monogramClass(EXCLUDED_GROUP)).toBe("bg-muted text-muted-foreground");
  });

  it("표에 없는 이름도 조용히 회색으로 떨어진다", () => {
    expect(monogramClass("없는 계열")).toBe("bg-muted text-muted-foreground");
  });

  /**
   * ⚠️ **이 테스트가 이 파일의 존재 이유다.** 새 교단 묶음이 생기면
   * `landing.ts`에는 추가하면서 **여기를 빠뜨리기 쉬운데, 그러면 그 묶음만 회색으로
   * 남고 아무 에러도 나지 않는다.**
   */
  it("랜딩이 있는 묶음 전부에 색이 있다 — landing.ts와 같은 출처를 본다", () => {
    const landing = landingGroups().map(({ group }) => group);
    expect([...coloredGroups()].sort()).toEqual([...landing].sort());
  });

  /** 실데이터의 묶음 이름과 표의 키가 어긋나면 색이 통째로 안 붙는다 */
  it("실데이터의 묶음 이름과 표의 키가 맞는다", () => {
    const inData = new Set(
      churches
        .map((church) => church.denominationGroup)
        .filter((group): group is string => Boolean(group)),
    );
    for (const group of coloredGroups()) expect(inData).toContain(group);
  });

  /*
    ⚠️ **클래스를 조립하지 않고 통째로 적는 규칙을 고정한다.** 템플릿 문자열로 만들면
    **Tailwind가 스캔에서 못 찾아 그 색이 CSS에 없고**, 화면에서는 색만 조용히 빠진다.
  */
  it("채움과 글자를 한 쌍으로 돌려준다", () => {
    for (const group of coloredGroups()) {
      const cls = monogramClass(group);
      expect(cls).toMatch(/^bg-group-[a-z]+\/12 text-group-[a-z]+$/);
    }
  });

  it("묶음마다 서로 다른 색이다 — 같은 색이 둘이면 구분이 사라진다", () => {
    const classes = coloredGroups().map(monogramClass);
    expect(new Set(classes).size).toBe(classes.length);
  });
});
