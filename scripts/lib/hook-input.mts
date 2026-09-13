// PreToolUse 훅이 받는 입력에서 필요한 것만 꺼낸다.
//
// 훅 본체(scripts/hooks/check-sensitive.mts)는 stdin을 읽고 종료 코드를 내는 일만 하고,
// 판정은 여기 있다 — 최상위에서 즉시 실행되는 파일은 테스트할 수 없기 때문이다.

import { isAbsolute, relative, resolve, sep } from "node:path";

/** 훅 입력의 tool_input. 도구마다 모양이 다르므로 아는 키만 본다 */
export type ToolInput = Record<string, unknown>;

/**
 * **쓰이려는 내용**만 모은다. Write는 content, Edit는 new_string,
 * 여러 편집을 한 번에 하는 도구는 edits[].new_string을 쓴다.
 *
 * **old_string은 일부러 보지 않는다.** 그쪽까지 검사하면 이미 파일에 들어간
 * 민감정보를 *지우는* 편집이 막혀 버린다 — 고치려는 사람을 막는 꼴이다.
 */
export function extractNewContent(toolInput: ToolInput): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v) out.push(v);
  };

  push(toolInput.content); // Write
  push(toolInput.new_string); // Edit
  push(toolInput.new_source); // NotebookEdit

  const edits = toolInput.edits;
  if (Array.isArray(edits)) {
    for (const e of edits) {
      if (e && typeof e === "object") push((e as Record<string, unknown>).new_string);
    }
  }

  // 아는 키가 하나도 없으면 도구가 바뀐 것이다. 조용히 통과시키지 않고
  // old_string과 경로를 뺀 나머지를 훑는다 — 모르는 것은 검사하는 쪽으로 기운다.
  if (!out.length) {
    for (const [k, v] of Object.entries(toolInput)) {
      if (k === "old_string" || k === "file_path" || k === "notebook_path") continue;
      push(v);
    }
  }
  return out;
}

/**
 * data/ 아래 파일인지 본다. 이 훅은 데이터 파일에만 걸린다 —
 * 소스 코드까지 검사하면 정규식 상수나 테스트 픽스처에서 헛울린다.
 */
export function isUnderDataDir(root: string, filePath: unknown): boolean {
  if (typeof filePath !== "string" || !filePath) return false;
  const abs = isAbsolute(filePath) ? filePath : resolve(root, filePath);
  const rel = relative(root, abs);
  if (!rel || rel.startsWith("..")) return false;
  return rel.split(sep)[0] === "data";
}
