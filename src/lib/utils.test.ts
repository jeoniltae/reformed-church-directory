// cn() 단위 테스트 — 커스텀 타이포 단계가 색상으로 오인되지 않는지 고정한다

import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("커스텀 타이포 클래스가 글자색을 지우지 않는다", () => {
    // tailwind-merge가 `text-t4`를 색상으로 오인하면 앞의 색이 사라진다.
    // 지역 필터의 선택된 칩 글자가 흰색 대신 검정으로 나온 실제 버그다.
    const result = cn("text-primary-foreground", "text-t4");
    expect(result).toContain("text-primary-foreground");
    expect(result).toContain("text-t4");
  });

  it("커스텀 타이포 클래스가 Tailwind 기본 크기를 덮는다", () => {
    // 크기로 인식돼야 같은 그룹으로 묶여 뒤엣것만 남는다
    expect(cn("text-sm", "text-t5")).toBe("text-t5");
    expect(cn("text-t5", "text-base")).toBe("text-base");
  });

  it("등록한 단계 전부가 크기로 인식된다", () => {
    for (const step of ["t2", "t4", "t5", "t6", "t8", "t9", "t10"]) {
      expect(cn("text-sm", `text-${step}`)).toBe(`text-${step}`);
    }
  });

  it("글자색끼리는 여전히 뒤엣것만 남는다", () => {
    expect(cn("text-foreground", "text-muted-foreground")).toBe(
      "text-muted-foreground",
    );
  });
});
