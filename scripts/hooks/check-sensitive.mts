// PreToolUse 훅 — data/ 아래에 민감정보가 쓰이려 하면 막는다.
//
// **git 이력은 되돌릴 수 없다.** churches.json에서 지워도 public 저장소 이력에는
// 남고 포크·클론된 사본은 회수할 수 없다. 그래서 출구가 아니라 입구에서 막는다.
//
// .claude/settings.json의 hooks.PreToolUse에서 부른다. 검사 로직을 settings.json에
// 인라인으로 쓰지 않는 이유는 그렇게 하면 테스트할 수 없기 때문이다.
//
// 종료 코드: 0 통과 · 2 차단(stderr가 Claude에게 전달된다)
//
// npm run church는 쓰기 직전에 같은 scanSensitive를 부른다. 손으로 고치든
// CLI로 고치든 같은 선이 걸리게 하려는 이중 방어다.

import { readFileSync } from "node:fs";
import { extractNewContent, isUnderDataDir, type ToolInput } from "../lib/hook-input.mts";
import { formatHits, scanSensitive } from "../lib/sensitive.mts";

type HookPayload = {
  cwd?: string;
  tool_name?: string;
  tool_input?: ToolInput;
};

/** 입력이 예상과 다르면 통과시킨다. 훅이 도구를 망가뜨리는 쪽이 더 나쁘다 */
function allow(): never {
  process.exit(0);
}

let payload: HookPayload;
try {
  payload = JSON.parse(readFileSync(0, "utf8")) as HookPayload;
} catch {
  allow();
}

const toolInput = payload.tool_input;
if (!toolInput || typeof toolInput !== "object") allow();

const root = payload.cwd ?? process.cwd();
const filePath = toolInput.file_path ?? toolInput.notebook_path;
if (!isUnderDataDir(root, filePath)) allow();

const hits = extractNewContent(toolInput).flatMap((text) => {
  // JSON이면 파싱해서 경로까지 짚어 주고, 아니면 원문을 그대로 훑는다
  try {
    return scanSensitive(JSON.parse(text));
  } catch {
    return scanSensitive(text);
  }
});

if (!hits.length) allow();

console.error(`${filePath as string} 쓰기를 막았다.`);
console.error(formatHits(hits));
console.error(
  "\n이 값이 정말 필요한지 확인할 것. 교회 연락처는 소스가 연락처 항목으로 명시한 번호만 싣고, 이메일은 싣지 않는다.",
);
process.exit(2);
