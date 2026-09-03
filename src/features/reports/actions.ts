"use server";
// 제보를 GitHub Issues로 등록하는 Server Action — DB가 없으므로 이슈가 접수함이다

import {
  buildIssue,
  type ReportInput,
  type ReportState,
  validateReport,
} from "./report";

// 이 파일은 async 함수 하나만 export한다 — `"use server"`의 제약이다.
// 상태 타입과 초기값은 report.ts에 있다.
const API = "https://api.github.com";

export async function submitReport(
  _prev: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const input: ReportInput = {
    churchId: String(formData.get("churchId") ?? ""),
    kind: String(formData.get("kind") ?? ""),
    body: String(formData.get("body") ?? ""),
    source: String(formData.get("source") ?? ""),
  };

  // 폼을 우회한 값이 그대로 이슈로 가지 않도록 서버에서 다시 본다.
  // 클라이언트 검증은 편의이지 방어가 아니다.
  const errors = validateReport(input);
  if (errors.length) return { status: "error", messages: errors };

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    // 설정 누락은 이용자 잘못이 아니다. 원인은 서버 로그에만 남긴다.
    console.error("제보 접수 실패: GITHUB_TOKEN 또는 GITHUB_REPO가 없다");
    return {
      status: "error",
      messages: ["지금은 접수할 수 없습니다. 잠시 후 다시 시도해 주세요."],
    };
  }

  const issue = buildIssue(input);

  try {
    const response = await fetch(`${API}/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
      },
      body: JSON.stringify(issue),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `제보 접수 실패: GitHub ${response.status} ${await response.text()}`,
      );
      return {
        status: "error",
        messages: ["접수하지 못했습니다. 잠시 후 다시 시도해 주세요."],
      };
    }

    const created = (await response.json()) as { number?: number };
    return {
      status: "ok",
      messages: ["접수했습니다. 확인 후 반영하겠습니다."],
      issueNumber: created.number,
    };
  } catch (error) {
    console.error("제보 접수 실패:", error);
    return {
      status: "error",
      messages: ["접수하지 못했습니다. 잠시 후 다시 시도해 주세요."],
    };
  }
}
