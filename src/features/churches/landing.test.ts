// 랜딩 페이지 규칙 단위 테스트 — 실제 보유 데이터의 표기를 본떠 최소 표본을 만든다

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";
import {
  countBy,
  EXCLUDED_GROUP,
  facetLine,
  facetPhrase,
  facetText,
  groupFromSlug,
  groupSummary,
  hasRegionLanding,
  LANDING_MIN,
  landingGroups,
  landingRegions,
  regionSummary,
  slugFromGroup,
} from "./landing";
import type { FacetCount } from "./landing";

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

// 화면에 나가는 분포 줄. 실제 랜딩에서 나오던 문자열을 그대로 가져와 고정한다
//
// **규칙은 `facetLine`이 정하고 `facetText`는 그것을 납작하게 펼 뿐**이라, 규칙
// 검증은 읽기 쉬운 `facetText` 쪽으로 쓴다. 조각으로 갈라 주는지는 따로 한 건 본다.
describe("facetLine", () => {
  const counts = (...pairs: [string, number][]): FacetCount[] =>
    pairs.map(([value, count]) => ({ value, count }));
  const line = (given: FacetCount[], unit: string) =>
    facetText(facetLine(given, unit));

  it("숨긴 것이 있으면 `외 N종`으로 밝힌다", () => {
    const seoul = counts(
      ["합동 계열", 7],
      ["고신·고려 계열", 6],
      ["기타", 6],
      ["합신 계열", 5],
      ["대신 계열", 3],
    );

    expect(line(seoul, "종")).toBe(
      "합동 계열 7곳, 고신·고려 계열 6곳, 기타 6곳 외 2종",
    );
  });

  // 부산은 3종이 전부인데 `순`이 붙어 뒤에 더 있는 것처럼 읽혔다
  it("전부 보여줬으면 아무 말도 붙이지 않는다 — `순`을 쓰지 않는다", () => {
    const busan = counts(
      ["고신·고려 계열", 2],
      ["합신 계열", 1],
      ["합동 계열", 1],
    );

    expect(line(busan, "종")).toBe(
      "고신·고려 계열 2곳, 합신 계열 1곳, 합동 계열 1곳",
    );
    expect(line(busan, "종")).not.toContain("순");
  });

  // 충북이 `합신 계열 3곳 순`으로 나가 하나짜리에 순위를 매겼다
  it("항목이 하나뿐이어도 순위를 매기지 않는다", () => {
    expect(line(counts(["합신 계열", 3]), "종")).toBe("합신 계열 3곳");
  });

  it("꼬리가 한 개면 꼬리를 만들지 않고 그것까지 세운다", () => {
    const busan = counts(
      ["동래구", 1],
      ["부산진구", 1],
      ["사하구", 1],
      ["해운대구", 1],
    );

    expect(line(busan, "개")).toBe("동래구, 부산진구, 사하구, 해운대구");
    expect(line(busan, "개")).not.toContain("외 1개");
  });

  // `1곳`을 세 번 써도 분포를 말하지 못한다. 건수 내림차순이라 숨은 것도 전부 1이다
  it("전부 1곳이면 건수를 생략한다", () => {
    expect(line(counts(["북구", 1], ["광양시", 1], ["목포시", 1]), "개")).toBe(
      "북구, 광양시, 목포시",
    );
  });

  it("셀 것이 없으면 빈 줄이다 — 그 행은 그려지지 않는다", () => {
    expect(facetLine([], "개")).toEqual({ items: [], rest: "" });
    expect(line([], "개")).toBe("");
  });

  // 화면이 이름과 건수를 다르게 칠하려면 문자열이 아니라 조각이어야 한다
  it("이름과 건수를 갈라서 돌려준다", () => {
    const seoul = counts(["마포구", 4], ["관악구", 3], ["노원구", 3], ["강동구", 2], ["은평구", 1]);

    expect(facetLine(seoul, "개")).toEqual({
      items: [
        { name: "마포구", count: "4곳" },
        { name: "관악구", count: "3곳" },
        { name: "노원구", count: "3곳" },
      ],
      rest: "외 2개",
    });
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

  it("랜딩 지역은 전부 시군구 행을 만들 수 있다", () => {
    // subRegion이 통째로 빈 지역이 랜딩에 오르면 그 행이 통째로 사라진다.
    // 세종 2곳이 실제로 subRegion 없는 건이라, 그 지역이 임계값을 넘는 순간 걸린다.
    const empty = landingRegions(real).filter(
      (region) =>
        facetLine(
          countBy(
            real.filter((c) => c.region === region),
            "subRegion",
          ),
          "개",
        ).items.length === 0,
    );

    expect(empty).toEqual([]);
  });
});
