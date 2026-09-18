// 교단 원고와 실데이터의 대조 — 이 파일의 목적은 **누락을 잡는 것** 하나다
//
// `synods`는 사람이 쓰는 하드코딩이라 새 교단이 들어오면 조용히 빠진다. 화면에는
// 그 교단만 설명 없이 카드로 뜨고 아무 경고도 나지 않는다. 이 프로젝트는 같은 문제를
// 판정표에서 이미 한 번 풀었다 — *"표에 없는 표기는 조용히 비우지 않는다.
// import:source가 경고한다"*(CLAUDE.md). 원고 쪽에도 같은 장치를 둔다.
//
// **이 장치가 필요하다는 증거가 이미 나왔다.** 이 계획을 세운 뒤 이틀 만에 제주 4곳이
// 등록되며 교단 표기가 19종 → 20종이 됐다(`마스터스개혁파총회`). 원고를 19종으로
// 하드코딩한 뒤였다면 그 교단만 설명 없이 떴을 것이다.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import {
  allSynods,
  groupContent,
  ungroupedContent,
} from "./denomination-content";
import { EXCLUDED_GROUP, countBy, landingGroups } from "./landing";

// data.ts를 거치지 않고 직접 읽는다 — 이 테스트의 관심사는 파일 그 자체다
const real: Church[] = JSON.parse(readFileSync("data/churches.json", "utf8"));

describe("커버리지 — 수록된 교단이 전부 원고에 있는가", () => {
  it("churches.json의 denomination 고유값이 하나도 빠지지 않는다", () => {
    const written = new Set(allSynods().map((s) => s.denomination));
    const missing = countBy(real, "denomination")
      .map(({ value }) => value)
      .filter((short) => !written.has(short));

    expect(missing).toEqual([]);
  });

  // 반대 방향도 본다. 교회가 0곳인 총회가 원고에 남아 있으면 화면에 `0곳`이 뜬다
  it("원고에 있는 총회는 전부 수록 교회가 있다", () => {
    const live = new Set(real.map((c) => c.denomination).filter(Boolean));
    const orphan = allSynods()
      .map((s) => s.denomination)
      .filter((short) => !live.has(short));

    expect(orphan).toEqual([]);
  });

  it("같은 총회가 두 곳에 적히지 않는다", () => {
    const names = allSynods().map((s) => s.denomination);
    expect(names.length).toBe(new Set(names).size);
  });
});

describe("묶음 구성", () => {
  it("랜딩이 있는 묶음은 전부 원고를 갖는다", () => {
    const missing = landingGroups()
      .map(({ group }) => group)
      .filter((group) => !groupContent(group));

    expect(missing).toEqual([]);
  });

  // `기타`는 랜딩이 없어 groupContent로 찾을 수 없다. 허브가 ungrouped로 가져간다
  it("`기타`는 groups가 아니라 ungrouped에 있다", () => {
    expect(groupContent(EXCLUDED_GROUP)).toBeUndefined();
    expect(ungroupedContent().synods.length).toBeGreaterThan(0);
  });

  it("총회가 실제 묶음과 같은 자리에 있다", () => {
    // 원고의 `합신 계열` 칸에 적힌 총회가 데이터에서도 합신 계열이어야 한다.
    // 어긋나면 랜딩에 남의 교단 설명이 붙는다.
    const groupOf = new Map(
      real
        .filter((c) => c.denomination)
        .map((c) => [c.denomination as string, c.denominationGroup ?? ""]),
    );
    const wrong = landingGroups().flatMap(({ group }) =>
      (groupContent(group)?.synods ?? [])
        .filter((s) => groupOf.get(s.denomination) !== group)
        .map((s) => `${s.denomination}: 원고 ${group} / 데이터 ${groupOf.get(s.denomination)}`),
    );

    expect(wrong).toEqual([]);
  });
});

describe("원고 값의 형식", () => {
  it("정식 표기를 채운 행은 근거를 함께 남긴다", () => {
    const noSource = allSynods()
      .filter((s) => s.official && !s.sourceUrl)
      .map((s) => s.denomination);

    expect(noSource).toEqual([]);
  });

  // ⚠️ **신앙고백은 근거 없이 채우지 않는다.** 2차 자료의 "거의 모든 장로교단은
  // 웨스트민스터"로 메우면 대륙 3형식을 함께 쓰는 교단이 그 일반화에서 지워진다.
  it("신앙고백을 적은 행은 반드시 근거가 있다", () => {
    const noSource = allSynods()
      .filter((s) => s.confession && !s.sourceUrl)
      .map((s) => s.denomination);

    expect(noSource).toEqual([]);
  });
});
