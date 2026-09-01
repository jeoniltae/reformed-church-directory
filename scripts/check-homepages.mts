// 보유 교회의 홈페이지 URL 생존 확인 — 보고만 하고 data/churches.json은 건드리지 않는다

import { readFileSync } from "node:fs";
import type { Church } from "../src/types/church.ts";
import {
  decodeHtml,
  extractTitle,
  matchPlaceholder,
  titleMatchesName,
} from "./lib/page-title.mts";

const INPUT = "data/churches.json";
const DELAY_MS = 1200; // 초당 1건 이하 (같은 도메인이 연속되면 자연히 더 벌어진다)
const TIMEOUT_MS = 10_000;
/** <title>은 <head>에 있다. 앞부분만 받고 나머지는 버린다 */
const HEAD_BYTES = 64 * 1024;
const UA =
  "ReformedChurchDirectoryBot/0.1 (+https://github.com/jeoniltae/reformed-church-directory) link-check";

/** 상태코드만으로 생존을 판단할 수 없는 호스트 — 폐쇄된 카페도 200을 준다 */
const UNRELIABLE = /(^|\.)(cafe\.daum\.net|cafe\.naver\.com|blog\.naver\.com|m\.blog\.naver\.com)$/;

type Result = {
  church: Church;
  /**
   * dead — 도메인이 사라진 경우만. 죽은 링크 판정의 유일한 근거다.
   * placeholder — 도메인은 살아 있고 200을 주는데 내용이 호스팅 안내 페이지다.
   *   **후보일 뿐이다.** 사람이 열어 확인한 뒤 dead-links.json에 넣는다.
   * blocked — 서버는 살아 있는데 봇이 막히거나 원인을 모르는 경우. 사람이 봐야 한다.
   */
  kind: "ok" | "moved" | "unreliable" | "blocked" | "dead" | "placeholder";
  detail: string;
  /** 본문에서 가져오는 유일한 값. 나머지 본문은 어디에도 남기지 않는다 */
  title?: string;
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

/**
 * 응답 앞부분만 읽고 스트림을 끊는다.
 * 본문을 통째로 받지 않으려는 것이고, 실제로 500KB짜리 교회 홈페이지가 있었다.
 */
async function readHead(res: Response, limit: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();

  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (size < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      size += value.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
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

  if (!res.ok) {
    await res.body?.cancel();
    const bot = [401, 403, 405, 406, 429].includes(res.status);
    return {
      church,
      kind: "blocked",
      detail: `HTTP ${res.status}${bot ? " — 봇 차단 가능성" : ""}`,
    };
  }

  // 본문에서 가져오는 것은 <title> 하나다. 나머지는 버리고 어디에도 저장하지 않는다.
  const title = extractTitle(
    decodeHtml(
      await readHead(res, HEAD_BYTES),
      res.headers.get("content-type"),
    ),
  );

  const from = hostOf(url);
  const to = hostOf(res.url);
  const placeholder = matchPlaceholder(title);
  if (placeholder) {
    return { church, kind: "placeholder", detail: placeholder, title };
  }
  if (UNRELIABLE.test(to) || UNRELIABLE.test(from)) {
    return { church, kind: "unreliable", detail: `HTTP ${res.status} · ${to}`, title };
  }
  if (to && from && !sameSite(from, to)) {
    return { church, kind: "moved", detail: `${from} → ${to}`, title };
  }
  return { church, kind: "ok", detail: `HTTP ${res.status}`, title };
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
  process.stdout.write(
    r.kind === "ok" ? "." : r.kind === "dead" || r.kind === "placeholder" ? "x" : "?",
  );
}
console.log("\n");

const by = (kind: Result["kind"]) => results.filter((r) => r.kind === kind);
const line = (r: Result) =>
  `  ${r.church.name} (${r.church.subRegion ?? r.church.region})`.padEnd(28) +
  `${r.detail}\n    ${r.church.homepage}` +
  (r.title ? `\n    title: ${r.title}` : "");

console.log("=".repeat(60));
console.log(
  `정상 ${by("ok").length} · 이동 ${by("moved").length} · 카페·블로그 ${by("unreliable").length} · 확인불가 ${by("blocked").length} · 안내페이지 ${by("placeholder").length} · 죽음 ${by("dead").length}`,
);
console.log("=".repeat(60));

if (by("placeholder").length) {
  console.log(`\n■ 안내 페이지 — 살아 있는 척하는 죽은 링크 (${by("placeholder").length}건)\n`);
  console.log("  도메인은 살아 있고 HTTP 200을 주지만 내용이 호스팅 업체 안내 페이지다.");
  console.log("  DNS만 보는 판정으로는 걸리지 않아 정상으로 통과하던 유형이다.");
  console.log("  **후보일 뿐이다. 브라우저로 직접 열어 확인한 뒤 사람이");
  console.log("  data/dead-links.json에 넣는다 — 이 스크립트는 넣지 않는다.**\n");
  by("placeholder").forEach((r) => console.log(line(r)));
}

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

// 알려지지 않은 플랫폼의 안내 페이지를 훑어내기 위한 약한 신호다.
// 영문 title을 쓰는 정상 교회도 걸리므로 죽음 판정에 쓰지 않고 눈으로 볼 목록만 만든다.
const unrelated = by("ok").filter(
  (r) => !titleMatchesName(r.church.name, r.title),
);
if (unrelated.length) {
  console.log(`\n■ title이 교회명과 겹치지 않음 — 눈으로 확인 (${unrelated.length}건)\n`);
  console.log("  정상 응답이지만 title에 교회명이 없다. 영문 title을 쓰는 교회일 수도,");
  console.log("  위에서 잡지 못한 새 유형의 안내 페이지일 수도 있다.");
  console.log("  새 안내 페이지를 찾으면 scripts/lib/page-title.mts의 PLACEHOLDER에 추가한다.\n");
  unrelated.forEach((r) =>
    console.log(
      `  ${r.church.name}`.padEnd(24) + `${r.title ?? "(title 없음)"}\n    ${r.church.homepage}`,
    ),
  );
}

console.log("\n※ 이 스크립트는 보고만 한다. data/churches.json은 수정하지 않는다.");
console.log("※ 안내 페이지 판정도 후보 제시까지다. dead-links.json은 사람이 채운다.");
