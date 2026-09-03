// 제보 검증·이슈 조립 단위 테스트

import { describe, expect, it } from "vitest";
import {
  BODY_MAX,
  buildIssue,
  clean,
  countGraphemes,
  isReportKind,
  REPORT_KINDS,
  type ReportInput,
  validateReport,
} from "./report";

const input = (over: Partial<ReportInput> = {}): ReportInput => ({
  churchId: "갈보리교회-관악구",
  kind: "정보 수정",
  body: "전화번호가 바뀌었습니다.",
  source: "교회 홈페이지",
  ...over,
});

/** 눈에 보이지 않는 제어문자 — 소스에 직접 넣지 않고 이스케이프로 만든다 */
const BELL = String.fromCharCode(7);

describe("countGraphemes", () => {
  it("한글을 눈에 보이는 대로 센다", () => {
    expect(countGraphemes("갈보리교회")).toBe(5);
  });

  it("조합형 한글도 한 글자로 센다 — String.length로는 3이 나온다", () => {
    const composed = "각"; // ㄱ + ㅏ + ㄱ = 각
    expect(composed.length).toBe(3);
    expect(countGraphemes(composed)).toBe(1);
  });

  it("빈 문자열은 0", () => {
    expect(countGraphemes("")).toBe(0);
  });
});

describe("clean", () => {
  it("앞뒤 공백을 다듬는다", () => {
    expect(clean("  전화번호  ")).toBe("전화번호");
  });

  it("보이지 않는 제어문자를 지운다", () => {
    expect(clean(`전화${BELL}번호`)).toBe("전화번호");
  });

  it("줄바꿈은 남긴다 — 여러 줄 제보가 정상이다", () => {
    expect(clean("첫 줄\n둘째 줄")).toBe("첫 줄\n둘째 줄");
  });
});

describe("isReportKind", () => {
  it("정해진 세 유형만 통과시킨다", () => {
    for (const kind of REPORT_KINDS) expect(isReportKind(kind)).toBe(true);
    expect(isReportKind("예배시간")).toBe(false);
    expect(isReportKind("")).toBe(false);
  });

  it("삭제 요청이 반드시 들어 있다 — 공개에 따르는 의무다", () => {
    expect(REPORT_KINDS).toContain("삭제 요청");
  });
});

describe("validateReport", () => {
  it("정상 입력에는 오류가 없다", () => {
    expect(validateReport(input())).toEqual([]);
  });

  it("교회를 지정하지 않아도 통과한다 — 기타 제보가 있다", () => {
    expect(validateReport(input({ churchId: "" }))).toEqual([]);
  });

  it("확인하신 곳은 비어도 통과한다", () => {
    expect(validateReport(input({ source: "" }))).toEqual([]);
  });

  it("유형이 목록 밖이면 거른다 — 폼을 우회한 값이 이슈로 가지 않게 한다", () => {
    expect(validateReport(input({ kind: "삭제" }))).toContain(
      "제보 유형을 선택해 주세요.",
    );
  });

  it("내용이 비면 거른다. 공백뿐인 것도 빈 것으로 본다", () => {
    expect(validateReport(input({ body: "" }))).toContain(
      "내용을 입력해 주세요.",
    );
    expect(validateReport(input({ body: "   \n  " }))).toContain(
      "내용을 입력해 주세요.",
    );
  });

  it("내용 길이를 자소 기준으로 제한한다", () => {
    expect(validateReport(input({ body: "가".repeat(BODY_MAX) }))).toEqual([]);
    expect(
      validateReport(input({ body: "가".repeat(BODY_MAX + 1) })),
    ).toHaveLength(1);
  });
});

describe("buildIssue", () => {
  it("제목에 유형과 대상을 넣는다 — 라벨 없이도 목록에서 훑을 수 있다", () => {
    expect(buildIssue(input()).title).toBe("[정보 수정] 갈보리교회-관악구");
  });

  it("대상이 없으면 제목이 비지 않게 채운다", () => {
    expect(buildIssue(input({ churchId: "", kind: "기타" })).title).toBe(
      "[기타] 교회 미지정",
    );
  });

  it("본문에 유형·대상·출처·내용이 모두 들어간다", () => {
    const { body } = buildIssue(input());
    expect(body).toContain("정보 수정");
    expect(body).toContain("갈보리교회-관악구");
    expect(body).toContain("교회 홈페이지");
    expect(body).toContain("전화번호가 바뀌었습니다.");
  });

  it("빈 선택 항목은 비워 두지 않고 표시한다", () => {
    const { body } = buildIssue(input({ source: "" }));
    expect(body).toContain("**확인하신 곳**: (없음)");
  });

  it("제어문자가 이슈로 새어 나가지 않는다", () => {
    const { body } = buildIssue(input({ body: `전화${BELL}번호` }));
    expect(body).not.toContain(BELL);
    expect(body).toContain("전화번호");
  });
});
