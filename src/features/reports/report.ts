// 제보 입력의 검증과 이슈 본문 조립 — 순수 함수라 서버·클라이언트 양쪽에서 쓴다

/**
 * 제보 유형.
 *
 * **`삭제 요청`은 뺄 수 없다.** 공개에 따르는 의무이며 `CLAUDE.md`가 제보 폼에
 * 삭제 요청도 받는다고 명시할 것을 규정한다.
 */
export const REPORT_KINDS = ["정보 수정", "삭제 요청", "기타"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

export interface ReportInput {
  /** 상세 페이지에서 넘어오면 채워진다. 홈에서 바로 오면 빈 값이다 */
  churchId: string;
  kind: string;
  body: string;
  /** 어디서 확인했는지. 선택이지만 있으면 검증 부담이 크게 준다 */
  source: string;
}

/** 자유 서술 길이 상한 (자소 기준) */
export const BODY_MAX = 1000;
/** 출처 한 줄 상한 */
export const SOURCE_MAX = 200;

/**
 * 자소 단위로 센다.
 *
 * **`String.length`로 세면 한글이 어긋난다** — 조합형으로 들어온 `각`은 눈에는
 * 한 글자인데 UTF-16 길이가 3이다. 이모지도 마찬가지다. 입력창의 남은 글자 수와
 * 서버 검증이 같은 기준을 써야 하므로 순수 함수로 빼 둔다.
 */
export function countGraphemes(value: string): number {
  const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });
  return [...segmenter.segment(value)].length;
}

export function isReportKind(value: string): value is ReportKind {
  return (REPORT_KINDS as readonly string[]).includes(value);
}

/** 눈에 보이지 않는 제어문자. 줄바꿈과 탭은 남긴다 — 여러 줄 제보가 정상이다 */
const CONTROL_CHARS = new RegExp(
  `[${"\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F"}]`,
  "g",
);

/**
 * 제어문자를 지우고 앞뒤 공백을 다듬는다.
 * 이슈 본문에 그대로 들어가는 값이라 보이지 않는 문자를 남기지 않는다.
 */
export function clean(value: string): string {
  return value.replace(CONTROL_CHARS, "").trim();
}

/** 문제가 없으면 빈 배열 */
export function validateReport(input: ReportInput): string[] {
  const errors: string[] = [];

  if (!isReportKind(input.kind)) {
    errors.push("제보 유형을 선택해 주세요.");
  }

  const body = clean(input.body);
  if (!body) {
    errors.push("내용을 입력해 주세요.");
  } else if (countGraphemes(body) > BODY_MAX) {
    errors.push(`내용은 ${BODY_MAX}자까지 쓸 수 있습니다.`);
  }

  if (countGraphemes(clean(input.source)) > SOURCE_MAX) {
    errors.push(`확인하신 곳은 ${SOURCE_MAX}자까지 쓸 수 있습니다.`);
  }

  return errors;
}

export interface Issue {
  title: string;
  body: string;
}

/**
 * 폼의 제출 결과.
 *
 * **`actions.ts`가 아니라 여기 둔다.** `"use server"` 파일은 async 함수만
 * export할 수 있어서 상수를 함께 내보내면 런타임에 통째로 터진다
 * (`A "use server" file can only export async functions, found object`).
 * 타입 검사로는 잡히지 않고 제출을 눌러야 드러난다.
 */
export interface ReportState {
  status: "idle" | "ok" | "error";
  /** 사용자에게 보여줄 메시지. 오류는 여러 건일 수 있다 */
  messages: string[];
  /** 접수된 이슈 번호. 되물을 방법이 없으므로 본인이 확인할 수 있게 돌려준다 */
  issueNumber?: number;
}

export const INITIAL_REPORT_STATE: ReportState = {
  status: "idle",
  messages: [],
};

/**
 * 이슈 제목과 본문을 만든다.
 *
 * **라벨을 쓰지 않고 제목에 유형을 넣는다.** 라벨은 저장소에 미리 만들어 둬야
 * 하고, 없는 라벨을 보내면 이슈 생성 자체가 실패할 수 있다. 제목 접두사는
 * 아무 준비 없이 동작하고 목록에서 눈으로 훑기도 낫다. 나중에 자동화를
 * 붙일 때 라벨이 필요해지면 그때 더한다.
 */
export function buildIssue(input: ReportInput): Issue {
  const kind = clean(input.kind);
  const churchId = clean(input.churchId);
  const body = clean(input.body);
  const source = clean(input.source);

  const title = `[${kind}] ${churchId || "교회 미지정"}`;

  const lines = [
    `- **유형**: ${kind}`,
    `- **대상**: ${churchId || "(지정되지 않음)"}`,
    `- **확인하신 곳**: ${source || "(없음)"}`,
    "",
    "---",
    "",
    body,
    "",
    "---",
    "",
    "_사이트 제보 폼으로 접수됐습니다. 개인정보는 받지 않습니다._",
  ];

  return { title, body: lines.join("\n") };
}
