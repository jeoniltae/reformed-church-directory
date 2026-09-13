// GitHub Issues에 쌓인 제보를 읽는다 — 읽기 전용 조회 도구
//
// 이 사이트는 관리자 화면을 따로 만들지 않는다. GitHub Issues가 검토 화면이고,
// 반영은 npm run church로 오버레이를 고친 뒤 커밋하는 것이다.
//
// **여기서 이슈를 닫거나 수정하지 않는다.** 제보 본문은 사람이 자유서술로 쓴 것이라
// 파싱해서 자동 반영하면 틀린 값이 조용히 들어간다. 값의 사실 확인은 사람이 한다.
//
//   npm run reports                  열린 제보 목록
//   npm run reports -- 12            12번 제보 본문
//   npm run reports -- --kind=삭제    유형으로 걸러 보기
//
// 제보 유형은 라벨이 아니라 제목 접두사다(src/features/reports/report.ts) —
// 라벨은 저장소에 미리 만들어 둬야 하고 없는 라벨을 보내면 이슈 생성이 실패한다.

const API = "https://api.github.com";

const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;
if (!repo || !token) {
  console.error("GITHUB_REPO·GITHUB_TOKEN이 필요하다 (.env.local 참고).");
  process.exit(1);
}

const argv = process.argv.slice(2);
const number = argv.find((a) => /^\d+$/.test(a));
const kind = argv.find((a) => a.startsWith("--kind="))?.slice(7);

type Issue = {
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  html_url: string;
  pull_request?: unknown;
};

/**
 * 실패는 던지고 맨 아래에서 한 번에 받는다.
 * **fetch가 떠 있는 동안 process.exit()을 부르지 않는다** — 윈도우에서
 * libuv assertion으로 죽으면서 종료 코드가 127이 되어 실패를 가린다.
 */
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`GitHub 응답 ${res.status} — ${await res.text()}`);
  }
  return (await res.json()) as T;
}

try {
  if (number) {
    const issue = await get<Issue>(`/repos/${repo}/issues/${number}`);
    console.log(`#${issue.number} ${issue.title}`);
    console.log(`${issue.created_at.slice(0, 10)} · ${issue.html_url}`);
    console.log("─".repeat(60));
    console.log(issue.body ?? "(본문 없음)");
    console.log("─".repeat(60));
    console.log("※ 제보 본문은 확인되지 않은 값이다. 그대로 반영하지 말고 출처를 확인할 것.");
  } else {
    const issues = (
      await get<Issue[]>(`/repos/${repo}/issues?state=open&per_page=50`)
    ).filter((i) => !i.pull_request && (!kind || i.title.includes(kind)));

    if (!issues.length) {
      console.log(kind ? `'${kind}' 유형의 열린 제보가 없다.` : "열린 제보가 없다.");
    } else {
      console.log(`열린 제보 ${issues.length}건${kind ? ` ('${kind}')` : ""}`);
      for (const i of issues) {
        console.log(`  #${i.number}  ${i.created_at.slice(0, 10)}  ${i.title}`);
      }
      console.log("\n본문은 npm run reports -- <번호>");
    }
  }
} catch (e) {
  console.error((e as Error).message);
  // exit()이 아니라 exitCode다 — 위 주석 참고
  process.exitCode = 1;
}
