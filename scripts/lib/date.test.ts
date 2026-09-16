// date.mts 단위 테스트
//
// **UTC와 한국 날짜가 갈리는 시각을 고정한다.** 이 테스트가 없으면
// 오후에만 돌려 보고 "잘 되네" 하고 지나간다 — 버그가 나는 건 오전이다.

import { describe, expect, it } from "vitest";
import { todayInSeoul } from "./date.mts";

describe("todayInSeoul", () => {
  it("YYYY-MM-DD 형식이다", () => {
    expect(todayInSeoul()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  // 한국 시간 오전 8시 = UTC 전날 23시. toISOString()을 쓰면 여기서 하루 밀린다.
  it("한국 시간 오전에 UTC 날짜로 밀리지 않는다", () => {
    const beforeDawnUtc = new Date("2026-09-16T23:00:00Z");
    expect(beforeDawnUtc.toISOString().slice(0, 10)).toBe("2026-09-16");
    expect(todayInSeoul(beforeDawnUtc)).toBe("2026-09-17");
  });

  it("한국 시간 자정 직후도 그날로 센다", () => {
    expect(todayInSeoul(new Date("2026-09-16T15:00:00Z"))).toBe("2026-09-17");
  });

  it("한국 시간 자정 직전은 전날이다", () => {
    expect(todayInSeoul(new Date("2026-09-16T14:59:59Z"))).toBe("2026-09-16");
  });

  it("UTC와 한국 날짜가 같은 시간대에서도 맞다", () => {
    expect(todayInSeoul(new Date("2026-09-17T05:00:00Z"))).toBe("2026-09-17");
  });
});
