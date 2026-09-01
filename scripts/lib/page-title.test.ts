// page-title.mts 단위 테스트 — 실측한 안내 페이지 두 종을 고정한다

import { describe, expect, it } from "vitest";
import {
  decodeHtml,
  extractTitle,
  matchPlaceholder,
  titleMatchesName,
} from "./page-title.mts";

const utf8 = (s: string) => new TextEncoder().encode(s);

describe("extractTitle", () => {
  it("title 텍스트를 뽑는다", () => {
    expect(extractTitle("<html><head><title>복용교회</title></head>")).toBe(
      "복용교회",
    );
  });

  it("속성이 붙은 title도 뽑는다", () => {
    expect(extractTitle('<title lang="ko">양의문교회</title>')).toBe("양의문교회");
  });

  it("줄바꿈과 연속 공백을 한 칸으로 줄인다", () => {
    expect(extractTitle("<title>\n  대한예수교장로회\n  합동총회\n</title>")).toBe(
      "대한예수교장로회 합동총회",
    );
  });

  it("title이 없으면 undefined", () => {
    expect(extractTitle("<html><body>본문뿐</body></html>")).toBeUndefined();
  });

  it("빈 title은 undefined — 프레임셋 페이지가 이렇다", () => {
    expect(extractTitle("<title>   </title>")).toBeUndefined();
  });

  it("숫자 엔티티를 푼다 — jesusfamily.kr 실측 형태", () => {
    expect(extractTitle("<title>&#54856; - &#50696;&#49688;</title>")).toBe("홈 - 예수");
  });

  it("16진 엔티티와 이름 엔티티도 푼다", () => {
    expect(extractTitle("<title>&#xD64D; &amp; &nbsp;교회</title>")).toBe("홍 & 교회");
  });

  it("모르는 이름 엔티티는 그대로 둔다", () => {
    expect(extractTitle("<title>교회&zzz;</title>")).toBe("교회&zzz;");
  });
});

describe("decodeHtml", () => {
  it("UTF-8 본문을 그대로 읽는다", () => {
    expect(decodeHtml(utf8("<title>새언약교회</title>"))).toContain("새언약교회");
  });

  it("Content-Type의 charset을 따른다", () => {
    // EUC-KR로 인코딩된 "교회" (0xB1B3 0xC8B8)
    const buf = new Uint8Array([0x3c, 0x74, 0x3e, 0xb1, 0xb3, 0xc8, 0xb8]);
    expect(decodeHtml(buf, "text/html; charset=euc-kr")).toContain("교회");
  });

  it("헤더가 없으면 meta charset을 찾아 다시 디코딩한다", () => {
    // UTF-8로 읽으면 깨지지만 meta 선언은 ASCII라 읽힌다
    const head = utf8('<meta charset="euc-kr"><title>');
    const body = new Uint8Array([0xb1, 0xb3, 0xc8, 0xb8]); // "교회"
    const buf = new Uint8Array([...head, ...body]);
    expect(decodeHtml(buf)).toContain("교회");
  });

  it("알 수 없는 인코딩 이름이면 UTF-8로 떨어진다 — 던지지 않는다", () => {
    expect(decodeHtml(utf8("<title>언약교회</title>"), "text/html; charset=x-불명")).toContain(
      "언약교회",
    );
  });
});

describe("matchPlaceholder", () => {
  it("네이버 modoo! 종료 안내를 잡는다 — 세종말씀교회 실측값", () => {
    expect(matchPlaceholder("네이버 modoo!")).toMatch(/modoo/);
  });

  it("카페24 계정 미설정 안내를 잡는다 — 선실교회 실측값", () => {
    expect(matchPlaceholder("카페24 :: 대한민국 No.1 카페24 호스팅")).toMatch(
      /카페24/,
    );
  });

  it("교회 이름이 든 정상 title은 잡지 않는다", () => {
    expect(matchPlaceholder("복용교회")).toBeUndefined();
    expect(matchPlaceholder("독립개혁장로교회 광양개혁교회")).toBeUndefined();
  });

  it("홈피닷컴 Not Found를 잡는다 — 중심교회·진리사랑교회·죽림교회 실측값", () => {
    expect(matchPlaceholder("홈피닷컴 :: Not Found,")).toMatch(/홈피닷컴/);
  });

  it("온맘 홈피 중지를 잡는다 — 성가교회 실측값", () => {
    expect(matchPlaceholder("온맘 홈피 중지")).toMatch(/온맘/);
  });

  it("플랫폼 이름이 들어간 정상 title은 잡지 않는다 — 오탐 방지의 핵심", () => {
    // 그 플랫폼을 실제로 쓰는 교회. 안내 페이지의 고정 문구가 아니면 통과해야 한다
    expect(matchPlaceholder("modoo로 만든 세종말씀교회")).toBeUndefined();
    expect(matchPlaceholder("카페24로 만든 교회 홈페이지")).toBeUndefined();
    expect(matchPlaceholder("홈피닷컴 :: 중심교회")).toBeUndefined();
  });

  it("title이 없으면 undefined", () => {
    expect(matchPlaceholder(undefined)).toBeUndefined();
  });
});

describe("titleMatchesName", () => {
  it("교회명이 title에 그대로 있으면 참", () => {
    expect(titleMatchesName("복용교회", "복용교회")).toBe(true);
  });

  it("교단명이 앞에 붙어도 참 — 두 글자만 겹치면 된다", () => {
    expect(titleMatchesName("광양개혁교회", "독립개혁장로교회 광양개혁교회")).toBe(
      true,
    );
  });

  it("안내 페이지 title과는 겹치지 않는다", () => {
    expect(titleMatchesName("세종말씀교회", "네이버 modoo!")).toBe(false);
  });

  it("title이 없으면 거짓", () => {
    expect(titleMatchesName("언약교회", undefined)).toBe(false);
  });
});
