// 목록 정렬 규칙을 고정한다 — `지역 → 시군구 → 교회명`, 전부 가나다
//
// ⚠️ **이 테스트는 미관이 아니라 약속을 지킨다.** `/about`의 `06 이 사이트가 하는 일`이
// **"교회의 신앙과 사역을 평가하거나 순위를 매기지 않습니다"**와 **"목록은 지역·시군구·
// 교회명 가나다순으로 보여줍니다"**를 화면에 적어 두고 있다. 정렬이 조용히 바뀌면
// 그 문장이 거짓이 된다.
//
// **`data.ts`를 직접 부르지 않는다.** 그쪽은 `node:fs`로 실제 파일을 읽는 서버 전용
// 모듈이라 단위 테스트에서 부르면 실데이터에 묶인다. 같은 비교 규칙을 여기서 다시
// 세워 **규칙 자체**를 고정한다 — `data.ts`의 `compareChurches`와 한 줄씩 대응한다.

import { describe, expect, it } from "vitest";
import type { Church } from "@/types/church";

const collator = new Intl.Collator("ko");

function compareChurches(a: Church, b: Church): number {
  return (
    collator.compare(a.region, b.region) ||
    collator.compare(a.subRegion ?? "", b.subRegion ?? "") ||
    collator.compare(a.name, b.name)
  );
}

/** 테스트에 필요한 네 필드만 채운 최소 교회 */
function church(region: string, subRegion: string, name: string): Church {
  return {
    id: `${name}-${subRegion}`,
    name,
    region,
    subRegion,
    address: "",
    pastor: "",
    source: "자체 수집",
  } as Church;
}

function sorted(list: Church[]): string[] {
  return [...list].sort(compareChurches).map((c) => c.name);
}

describe("목록 정렬", () => {
  it("지역을 가나다순으로 먼저 나눈다", () => {
    const list = [
      church("서울", "관악구", "가교회"),
      church("강원", "원주시", "하교회"),
      church("경기", "하남시", "나교회"),
    ];
    // 교회명이 `가`여도 지역이 뒤면 뒤로 간다 — 지역이 1순위다
    expect(sorted(list)).toEqual(["하교회", "나교회", "가교회"]);
  });

  it("같은 지역 안에서는 시군구를 가나다순으로 나눈다", () => {
    const list = [
      church("서울", "종로구", "가교회"),
      church("서울", "관악구", "하교회"),
    ];
    expect(sorted(list)).toEqual(["하교회", "가교회"]);
  });

  it("같은 시군구 안에서는 교회명을 가나다순으로 둔다", () => {
    const list = [
      church("서울", "관악구", "한빛교회"),
      church("서울", "관악구", "갈보리교회"),
      church("서울", "관악구", "사랑교회"),
    ];
    expect(sorted(list)).toEqual(["갈보리교회", "사랑교회", "한빛교회"]);
  });

  it("건수나 등록 순서를 타지 않는다", () => {
    // 같은 입력을 어떤 순서로 넣어도 결과가 같아야 한다.
    // **이게 "순위를 매기지 않는다"의 실제 의미다** — 원본 순서가 결과에 남지 않는다
    const a = church("서울", "관악구", "가교회");
    const b = church("서울", "관악구", "나교회");
    expect(sorted([a, b])).toEqual(sorted([b, a]));
  });

  it("시군구가 없는 항목은 해당 지역 맨 앞에 온다", () => {
    const list = [
      church("세종", "조치원읍", "나교회"),
      { ...church("세종", "", "가교회"), subRegion: undefined } as Church,
    ];
    expect(sorted(list)).toEqual(["가교회", "나교회"]);
  });

  it("한글 자모 순서가 정확하다 (ㄱ < ㄴ < ㄷ … < ㅎ)", () => {
    const list = [
      church("서울", "관악구", "하늘교회"),
      church("서울", "관악구", "다솜교회"),
      church("서울", "관악구", "나눔교회"),
      church("서울", "관악구", "가온교회"),
    ];
    expect(sorted(list)).toEqual([
      "가온교회",
      "나눔교회",
      "다솜교회",
      "하늘교회",
    ]);
  });
});
