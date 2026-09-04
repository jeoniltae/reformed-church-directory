// 랜딩 페이지 규칙 단위 테스트 — 실제 보유 데이터의 표기를 본떠 최소 표본을 만든다

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import {
  countBy,
  EXCLUDED_GROUP,
  facetPhrase,
  groupFromSlug,
  groupSummary,
  hasRegionLanding,
  LANDING_MIN,
  landingGroups,
  landingRegions,
  regionSummary,
  slugFromGroup,
} from "./landing";

// 서울 3곳(임계값 충족) · 경기 2곳 · 부산 1곳(둘 다 미달)
const churches: Church[] = [
  {
    id: "언약교회-강동구",
    name: "언약교회",
    region: "서울",
    subRegion: "강동구",
    address: "서울 강동구 강일동 69",
    pastor: "이승구",
    denomination: "합신",
    denominationGroup: "합신 계열",
    source: "자체 수집",
  },
  {
    id: "바른교회-노원구",
    name: "바른교회",
    region: "서울",
    subRegion: "노원구",
    address: "서울 노원구 덕릉로79길 35",
    pastor: "배병권",
    denomination: "합신",
    denominationGroup: "합신 계열",
    source: "자체 수집",
  },
  {
    id: "한길교회-광진구",
    name: "한길교회",
    region: "서울",
    subRegion: "광진구",
    address: "서울 광진구 천호대로132길 8",
    pastor: "손재익",
    denomination: "고신",
    denominationGroup: "고신·고려 계열",
    source: "자체 수집",
  },
  {
    id: "새언약교회-김포시",
    name: "새언약교회",
    region: "경기",
    subRegion: "김포시",
    address: "경기 김포시 김포한강8로 173",
    pastor: "박상현",
    // 교단이 없는 6건을 대표한다 — 묶음 집계에서 빠지는 것이 정상이다
    source: "자체 수집",
  },
  {
    id: "안산푸른교회-안산시",
    name: "안산푸른교회",
    region: "경기",
    subRegion: "안산시",
    address: "경기 안산시 상록구 용신로 379",
    pastor: "김헌수",
    denomination: "합신",
    denominationGroup: "합신 계열",
    source: "자체 수집",
  },
  {
    id: "갈보리교회-금정구",
    name: "갈보리교회",
    region: "부산",
    subRegion: "금정구",
    address: "부산 금정구 중앙대로 1841",
    pastor: "강구원",
    denomination: "고려",
    denominationGroup: "고신·고려 계열",
    source: "자체 수집",
  },
];

describe("countBy", () => {
  it("건수 내림차순으로 센다", () => {
    expect(countBy(churches, "region")).toEqual([
      { value: "서울", count: 3 },
      { value: "경기", count: 2 },
      { value: "부산", count: 1 },
    ]);
  });

  it("값이 없는 건은 세지 않는다", () => {
    // 교단 없는 새언약교회가 빠져 합계가 6이 아니라 5다
    const groups = countBy(churches, "denominationGroup");
    expect(groups.reduce((sum, g) => sum + g.count, 0)).toBe(5);
  });
});

describe("landingRegions", () => {
  it("임계값 이상인 지역만 돌려준다", () => {
    expect(landingRegions(churches)).toEqual(["서울"]);
  });

  it("임계값은 3이다 — 바뀌면 색인 대상이 통째로 달라진다", () => {
    expect(LANDING_MIN).toBe(3);
  });
});

describe("hasRegionLanding", () => {
  it("임계값을 채운 지역만 참이다", () => {
    expect(hasRegionLanding(churches, "서울")).toBe(true);
    expect(hasRegionLanding(churches, "경기")).toBe(false);
    expect(hasRegionLanding(churches, "없는지역")).toBe(false);
  });
});

describe("교단 slug", () => {
  it("slug와 묶음 이름을 양방향으로 옮긴다", () => {
    expect(groupFromSlug("고신고려")).toBe("고신·고려 계열");
    expect(slugFromGroup("고신·고려 계열")).toBe("고신고려");
  });

  it("`기타`는 랜딩을 만들지 않는다", () => {
    expect(slugFromGroup(EXCLUDED_GROUP)).toBeUndefined();
    expect(landingGroups().map((g) => g.group)).not.toContain(EXCLUDED_GROUP);
  });

  it("표에 없는 slug는 undefined다 — 없는 주소를 404로 보내는 근거다", () => {
    expect(groupFromSlug("없는교단")).toBeUndefined();
  });

  it("주소에 쓰는 slug에는 공백과 가운뎃점이 없다", () => {
    for (const { slug } of landingGroups()) {
      expect(slug).not.toMatch(/[\s·]/);
    }
  });
});

describe("facetPhrase", () => {
  it("상위 세 개만 잇는다", () => {
    expect(facetPhrase(countBy(churches, "region"))).toBe(
      "서울 3곳, 경기 2곳, 부산 1곳",
    );
    expect(facetPhrase(countBy(churches, "region"), 2)).toBe("서울 3곳, 경기 2곳");
  });
});

describe("안내 문장", () => {
  const seoul = churches.filter((c) => c.region === "서울");
  const busan = churches.filter((c) => c.region === "부산");

  it("지역 — 교단이 여럿이면 분포를 밝힌다", () => {
    expect(regionSummary("서울", seoul)).toBe(
      "서울에 있는 개혁주의 교회 3곳입니다. 교단별로는 합신 계열 2곳, 고신·고려 계열 1곳 순입니다.",
    );
  });

  it("지역 — 교단이 하나면 `순`을 쓰지 않는다", () => {
    expect(regionSummary("부산", busan)).toBe(
      "부산에 있는 개혁주의 교회 1곳입니다. 교단은 고신·고려 계열 1곳입니다.",
    );
  });

  it("지역 — 교단 정보가 아예 없으면 건수만 말한다", () => {
    const noGroup = churches.filter((c) => !c.denominationGroup);
    expect(regionSummary("경기", noGroup)).toBe(
      "경기에 있는 개혁주의 교회 1곳입니다.",
    );
  });

  it("교단 — 지역이 여럿이면 분포를, 하나면 그 지역을 밝힌다", () => {
    const hapsin = churches.filter((c) => c.denominationGroup === "합신 계열");
    expect(groupSummary("합신 계열", hapsin)).toBe(
      "합신 계열 교회 3곳입니다. 지역별로는 서울 2곳, 경기 1곳 순입니다.",
    );
    expect(groupSummary("고신·고려 계열", busan)).toBe(
      "고신·고려 계열 교회 1곳입니다. 모두 부산에 있습니다.",
    );
  });
});

describe("실데이터와의 대조", () => {
  // data.ts를 거치지 않고 직접 읽는다 — 이 테스트의 관심사는 파일 그 자체다
  const real: Church[] = JSON.parse(readFileSync("data/churches.json", "utf8"));

  it("데이터에 있는 묶음은 `기타`를 빼고 전부 slug를 갖는다", () => {
    // 교단 묶음이 새로 생겼는데 LANDING_GROUPS에 추가하지 않으면 그 묶음은
    // 랜딩도 sitemap도 없이 조용히 빠진다. 확장 때 이 테스트가 먼저 깨진다.
    const missing = countBy(real, "denominationGroup")
      .map(({ value }) => value)
      .filter((group) => group !== EXCLUDED_GROUP && !slugFromGroup(group));

    expect(missing).toEqual([]);
  });

  it("미리 구울 지역이 실제로 존재한다", () => {
    expect(landingRegions(real).length).toBeGreaterThan(0);
  });
});
