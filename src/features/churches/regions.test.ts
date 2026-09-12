// 시도 표준 목록을 고정한다
//
// ⚠️ **홈의 지역 칩이 "전국을 다 보여준다"고 약속하는 화면이 됐다.** 수록 0인
// 지역까지 세워 두는 이유가 **"빠뜨린 것이 아니라 아직 없다"**를 전달하는 것이므로,
// 목록에 구멍이 생기면 그 약속이 조용히 깨진다.

import { describe, expect, it } from "vitest";
import churches from "../../../data/churches.json";
import { STANDARD_REGIONS } from "./regions";

const regions: string[] = [...STANDARD_REGIONS];

describe("STANDARD_REGIONS", () => {
  it("데이터에 등장하는 지역을 하나도 빠뜨리지 않는다", () => {
    // 이게 깨지면 그 지역 교회들이 **홈에서 찾아갈 길을 잃는다**
    const inData = [...new Set((churches as { region: string }[]).map((c) => c.region))];
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
    // 제주는 현재 수록 교회가 없지만 화면에 `0`으로 남아야 한다
    expect(regions).toContain("제주");
  });
});
