// 타이포 스케일 등록을 고정한다 — 색상 오인(cn)과 미등록 단계(@theme·화면) 둘 다

import { readdirSync, readFileSync } from "node:fs";
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
    for (const step of ["t2", "t4", "t5", "t6", "t7", "t8", "t9", "t10"]) {
      expect(cn("text-sm", `text-${step}`)).toBe(`text-${step}`);
    }
  });

  it("글자색끼리는 여전히 뒤엣것만 남는다", () => {
    expect(cn("text-foreground", "text-muted-foreground")).toBe(
      "text-muted-foreground",
    );
  });
});

/**
 * **단계가 없는 `text-t*`는 조용히 사라진다.** Tailwind는 `@theme`에 없는 이름으로
 * 클래스를 만들지 않는데 **빌드도 lint도 통과한다** — 그 글자만 브라우저 기본값으로
 * 나갈 뿐이라 화면을 직접 보지 않으면 모른다. `/denomination/[group]`의 안내 문단이
 * `text-t3`으로 적혀 16px으로 나가면서 **바로 위 t4 행보다 커져 있었다**(2026-09-18).
 *
 * 그래서 세 곳이 어긋나지 않는지 본다 — `globals.css`의 `@theme` · `utils.ts`의
 * tailwind-merge 등록 · 화면에서 실제로 쓰는 클래스.
 */
describe("타이포 스케일 등록", () => {
  const stepsIn = (source: string, pattern: RegExp) => [
    ...new Set([...source.matchAll(pattern)].map(([, step]) => step)),
  ].sort();

  const defined = stepsIn(
    readFileSync("src/app/globals.css", "utf8"),
    /--text-(t[0-9]+):/g,
  );
  const registered = stepsIn(
    // `{ text: ["t2", …] }` 한 덩어리만 본다 — 파일의 다른 문자열에 휘둘리지 않게
    readFileSync("src/lib/utils.ts", "utf8").match(/text: \[[^\]]*\]/)?.[0] ?? "",
    /"(t[0-9]+)"/g,
  );

  // 주석은 걷어낸다 — 이 결함을 설명하는 주석에 `text-t3`이 그대로 적혀 있다.
  // `[^:]`는 `https://`를 줄 주석으로 오해하지 않기 위한 것이다
  const stripComments = (code: string) =>
    code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");

  const sources = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const child = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return sources(child);
      return /\.tsx?$/.test(entry.name) ? [child] : [];
    });

  it("찾아낸 단계가 비어 있지 않다", () => {
    // 정규식이 빗나가면 `[] === []`로 두 테스트가 통과해 버린다 — 그 침묵을 막는다
    expect(defined.length).toBeGreaterThan(0);
    expect(sources("src").length).toBeGreaterThan(0);
  });

  it("`@theme`과 tailwind-merge 등록 목록이 같다", () => {
    // 한쪽에만 있으면 그 단계가 **색상으로 오인돼 같은 cn() 안의 색을 지운다**
    expect(registered).toEqual(defined);
  });

  it("화면에서 쓰는 `text-t*`가 전부 `@theme`에 있다", () => {
    const missing = sources("src").flatMap((file) =>
      stepsIn(stripComments(readFileSync(file, "utf8")), /text-(t[0-9]+)/g)
        .filter((step) => !defined.includes(step))
        .map((step) => `text-${step} (${file})`),
    );

    expect(missing).toEqual([]);
  });
});
