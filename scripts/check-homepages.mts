// 보유 교회의 홈페이지 URL 생존 확인 — 보고만 하고 data/churches.json은 건드리지 않는다

import { readFileSync } from "node:fs";
import type { Church } from "../src/types/church.ts";

const INPUT = "data/churches.json";
const DELAY_MS = 1200; // 초당 1건 이하 (같은 도메인이 연속되면 자연히 더 벌어진다)
const TIMEOUT_MS = 10_000;
const UA =
  "ReformedChurchDirectoryBot/0.1 (+https://github.com/jeoniltae/reformed-church-directory) link-check";

/** 상태코드만으로 생존을 판단할 수 없는 호스트 — 폐쇄된 카페도 200을 준다 */
const UNRELIABLE = /(^|\.)(cafe\.daum\.net|cafe\.naver\.com|blog\.naver\.com|m\.blog\.naver\.com)$/;

type Result = {
  church: Church;
  /**
   * dead — 도메인이 사라진 경우만. 죽은 링크 판정의 유일한 근거다.
   * blocked — 서버는 살아 있는데 봇이 막히거나 원인을 모르는 경우. 사람이 봐야 한다.
   */
  kind: "ok" | "moved" | "unreliable" | "blocked" | "dead";
  detail: string;
};

/** DNS 단계에서 실패했는가 — 도메인 자체가 없다는 뜻이다 */
const isDnsFailure = (e: unknown) =>
  ["ENOTFOUND", "EAI_AGAIN"].includes(
    (e as { cause?: { code?: string } })?.cause?.code ?? "",
  );

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
};

/** www 유무는 같은 사이트로 본다 — 리다이렉트 판정에서 잡음이 된다 */
const sameSite = (a: string, b: string) =>
  a.replace(/^www\./, "") === b.replace(/^www\./, "");

/** Node의 `fetch failed`는 실제 원인을 cause에 숨긴다. 도메인 소멸과 서버 다운은 의미가 다르다 */
function reason(e: unknown): string {
  const cause = (e as { cause?: { code?: string; message?: string } })?.cause;
  const code = cause?.code;
  const known: Record<string, string> = {
    ENOTFOUND: "도메인 없음 (DNS 조회 실패) — 만료 가능성 높음",
    EAI_AGAIN: "DNS 일시 실패 — 재확인 필요",
    ECONNREFUSED: "연결 거부 — 서버가 응답하지 않음",
    ECONNRESET: "연결 끊김",
    ETIMEDOUT: "연결 시간 초과",
    UND_ERR_CONNECT_TIMEOUT: "연결 시간 초과",
    CERT_HAS_EXPIRED: "인증서 만료",
    ERR_TLS_CERT_ALTNAME_INVALID: "인증서 도메인 불일치",
    EPROTO: "TLS 협상 실패",
  };
  if (code && known[code]) return known[code];
  const msg = e instanceof Error ? e.message : String(e);
  if (/timeout|abort/i.test(msg)) return "응답 없음 (타임아웃)";
  return code ? `${code}: ${cause?.message ?? ""}`.trim() : msg;
}

async function check(church: Church): Promise<Result> {
  const url = church.homepage!;
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    // 도메인이 사라진 경우만 죽음으로 본다. 나머지는 서버 문제일 수도, 봇 차단일 수도 있다.
    return {
      church,
      kind: isDnsFailure(e) ? "dead" : "blocked",
      detail: reason(e),
    };
  }

  // 본문은 읽지 않는다. 생존 확인에 필요 없고, 받아두면 저장 유혹이 생긴다.
  await res.body?.cancel();

  if (!res.ok) {
    const bot = [401, 403, 405, 406, 429].includes(res.status);
    return {
      church,
      kind: "blocked",
      detail: `HTTP ${res.status}${bot ? " — 봇 차단 가능성" : ""}`,
    };
  }

  const from = hostOf(url);
  const to = hostOf(res.url);
  if (UNRELIABLE.test(to) || UNRELIABLE.test(from)) {
    return { church, kind: "unreliable", detail: `HTTP ${res.status} · ${to}` };
  }
  if (to && from && !sameSite(from, to)) {
    return { church, kind: "moved", detail: `${from} → ${to}` };
  }
  return { church, kind: "ok", detail: `HTTP ${res.status}` };
}

const churches: Church[] = JSON.parse(readFileSync(INPUT, "utf8"));
// 일부만 다시 볼 때 쓴다 — 전체를 매번 두드리지 않기 위해서다
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const targets = churches.filter(
  (c) => c.homepage && (!only || c.name.includes(only) || c.homepage.includes(only)),
);

if (only) console.log(`필터: --only=${only}`);
console.log(
  `홈페이지 있음 ${targets.length}건 / 없음 ${churches.length - targets.length}건`,
);
console.log(`요청 간격 ${DELAY_MS}ms · 예상 소요 약 ${Math.ceil((targets.length * (DELAY_MS + 800)) / 60000)}분\n`);

const results: Result[] = [];
for (const [i, church] of targets.entries()) {
  if (i > 0) await sleep(DELAY_MS);
  const r = await check(church);
  results.push(r);
  process.stdout.write(r.kind === "ok" ? "." : r.kind === "dead" ? "x" : "?");
}
console.log("\n");

const by = (kind: Result["kind"]) => results.filter((r) => r.kind === kind);
const line = (r: Result) =>
  `  ${r.church.name} (${r.church.subRegion ?? r.church.region})`.padEnd(28) +
  `${r.detail}\n    ${r.church.homepage}`;

console.log("=".repeat(60));
console.log(
  `정상 ${by("ok").length} · 이동 ${by("moved").length} · 카페·블로그 ${by("unreliable").length} · 확인불가 ${by("blocked").length} · 죽음 ${by("dead").length}`,
);
console.log("=".repeat(60));

if (by("dead").length) {
  console.log(`\n■ 죽음 — 도메인 소멸 (${by("dead").length}건)\n`);
  console.log("  DNS 조회가 실패했다. 도메인 자체가 없으므로 브라우저로도 열리지 않는다.");
  console.log("  data/dead-links.json에 등록하면 변환 시 homepage가 비워진다.\n");
  by("dead").forEach((r) => console.log(line(r)));
}

if (by("blocked").length) {
  console.log(`\n■ 확인 불가 — 사람이 봐야 한다 (${by("blocked").length}건)\n`);
  console.log("  서버는 응답했거나 도메인은 살아 있다. 봇 차단·구형 TLS·일시 장애일 수 있다.");
  console.log("  브라우저로는 정상인 경우가 실제로 있었다. 죽은 링크로 처리하지 말 것.\n");
  by("blocked").forEach((r) => console.log(line(r)));
}

if (by("moved").length) {
  console.log(`\n■ 다른 호스트로 이동 (${by("moved").length}건)\n`);
  console.log("  리다이렉트 목적지가 원래 도메인과 다르다. 이전인지 도메인 만료 후");
  console.log("  주차 페이지인지 사람이 확인해야 한다.\n");
  by("moved").forEach((r) => console.log(line(r)));
}

if (by("unreliable").length) {
  console.log(`\n■ 카페·블로그 — 상태코드로 판단 불가 (${by("unreliable").length}건)\n`);
  console.log("  폐쇄된 카페도 200을 돌려준다. 2단계에서 본문을 볼 때 함께 확인한다.\n");
  by("unreliable").forEach((r) => console.log(line(r)));
}

console.log("\n※ 이 스크립트는 보고만 한다. data/churches.json은 수정하지 않는다.");
