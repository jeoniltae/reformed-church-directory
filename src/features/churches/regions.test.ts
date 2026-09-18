// 시도 표준 목록을 고정한다
//
// ⚠️ **홈의 지역 칩이 "전국을 다 보여준다"고 약속하는 화면이 됐다.** 수록 0인
// 지역까지 세워 두는 이유가 **"빠뜨린 것이 아니라 아직 없다"**를 전달하는 것이므로,
// 목록에 구멍이 생기면 그 약속이 조용히 깨진다.

import { describe, expect, it } from "vitest";
import churches from "../../../data/churches.json";
import { sampleRegions, STANDARD_REGIONS } from "./regions";

const regions: string[] = [...STANDARD_REGIONS];

describe("STANDARD_REGIONS", () => {
  it("데이터에 등장하는 지역을 하나도 빠뜨리지 않는다", () => {
    // 이게 깨지면 그 지역 교회들이 **홈에서 찾아갈 길을 잃는다**
    const inData = [
      ...new Set((churches as { region: string }[]).map((c) => c.region)),
    ];
    expect(regions).toEqual(expect.arrayContaining(inData));
  });

  it("중복이 없다", () => {
    expect(new Set(regions).size).toBe(regions.length);
  });

  it("건수 순이 아니다 — 서울 다음이 부산이다", () => {
    // ⚠️ 건수 내림차순으로 되돌리면 지역에 서열이 생기고,
    // `/about`의 "노출 순서에 어떤 평가도 반영하지 않습니다"가 거짓이 된다.
    // 건수 2위는 경기(26)지만 표준 순서에서는 부산이 와야 한다
    expect(regions[0]).toBe("서울");
    expect(regions[1]).toBe("부산");
  });

  it("통합된 단위를 도로 쪼개지 않는다", () => {
    // 도로명주소 API가 `전남광주통합특별시`를 돌려준다 — 정부가 통합한 단위다
    expect(regions).toContain("전남광주");
    expect(regions).not.toContain("전남");
    expect(regions).not.toContain("광주");
  });

  it("수록 0인 지역도 들어 있다", () => {
    // `regions`는 데이터에서 만들지 않고 고정한 목록이다 — 수록 0인 시도도 칩에 `0`으로
    // 남아야 "빠뜨린 건지 아직 없는 건지"를 이용자가 구분할 수 있다.
    // 제주가 그 사례였고 2026-09-18에 4건이 들어와 지금은 0인 시도가 없다. 장치는 유지한다.
    expect(regions).toContain("제주");
  });
});

describe("sampleRegions", () => {
  // 동점(4곳)이 섞인 픽스처다. **실제 데이터를 그대로 비추지 않는다** — 제주가 빠져 있고,
  // 이 배열은 아래 `입력에 없는 지역은 뽑지 않는다`가 쓰는 장치라 일부러 그대로 둔다.
  const all = [
    "서울",
    "부산",
    "대구",
    "인천",
    "대전",
    "울산",
    "세종",
    "경기",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남광주",
    "경북",
    "경남",
  ];

  it("요청한 개수만큼 서로 다른 지역을 뽑는다", () => {
    const picked = sampleRegions(all, 5);
    expect(picked).toHaveLength(5);
    expect(new Set(picked).size).toBe(5);
  });

  it("표준 순서로 돌려준다 — 굴러가는 차례가 뒤죽박죽이면 임의로 보인다", () => {
    const picked = sampleRegions(all, 5);
    const order = picked.map((r) => regions.indexOf(r));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("입력에 없는 지역은 뽑지 않는다", () => {
    // 입력에 없는 지역이 뽑히면 `오늘, <그 지역>에서 예배하러 가시나요?`가 거짓말이 된다.
    // 위 픽스처에 제주가 없으므로 제주로 확인한다(실제 데이터에는 이제 제주가 있다).
    expect(sampleRegions(all, 5)).not.toContain("제주");
  });

  it("요청 개수가 지역 수보다 많으면 있는 만큼만 준다", () => {
    // 칸이 비면 롤링 주기에 빈 구간이 생긴다
    expect(sampleRegions(["서울", "경기"], 5)).toHaveLength(2);
  });

  it("⚠️ 건수 상위 고정이 아니다 — 모든 지역이 뽑힐 수 있어야 한다", () => {
    // 이게 이번에 고친 버그다. 상위 5 고정이면 아래 열 곳은 **영원히** 나오지 않았다
    const 못나오던지역 = [
      "충북",
      "전남광주",
      "대구",
      "세종",
      "경북",
      "충남",
      "강원",
      "대전",
      "울산",
      "경남",
    ];
    const 한번이라도나온지역 = new Set<string>();
    for (let i = 0; i < 500; i++) {
      sampleRegions(all, 5).forEach((r) => 한번이라도나온지역.add(r));
    }
    못나오던지역.forEach((r) => expect(한번이라도나온지역).toContain(r));
  });

  it("⚠️ 동점을 임의로 자르지 않는다 — 충북·부산·인천이 고르게 나온다", () => {
    // 예전에는 넷 중 부산·인천만 뽑히고 충북은 잘렸다
    const count = new Map(["충북", "부산", "인천"].map((r) => [r, 0]));
    for (let i = 0; i < 3000; i++) {
      sampleRegions(all, 5).forEach((r) => {
        if (count.has(r)) count.set(r, (count.get(r) ?? 0) + 1);
      });
    }
    // 각 지역이 뽑힐 확률은 5/15 ≈ 33%. 셋의 편차가 크면 공정하지 않다
    const values = [...count.values()];
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(min / max).toBeGreaterThan(0.85);
  });
});
