// 응답 본문에서 <title>만 뽑아 죽은 링크를 가려내는 순수 함수 모음
//
// check-homepages는 원래 본문을 읽지 않았다. 상태코드만으로 충분하다고 봤고,
// 받아두면 저장 유혹이 생긴다는 이유였다. 그런데 **DNS는 살아 있고 200을 주면서
// 내용은 호스팅 업체 안내 페이지**인 유형을 그 방식으로는 못 잡는다(세종말씀교회
// modoo.at, 선실교회 cafe24). 그래서 본문 중 <title> 한 줄만 보기로 했다.
// 나머지 본문은 어디에도 남기지 않는다 — 원래 규칙의 취지는 그대로 지킨다.

const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const CHARSET_RE = /charset\s*=\s*["']?([\w-]+)/i;

function tryDecode(buf: Uint8Array, label: string): string | undefined {
  try {
    return new TextDecoder(label).decode(buf);
  } catch {
    return undefined; // 알 수 없는 인코딩 이름
  }
}

/**
 * 한글 교회 홈페이지는 EUC-KR이 드물지 않다(실측: afamily.ijesus.net).
 * UTF-8로 잘못 읽으면 title이 깨져 판정이 통째로 무의미해진다.
 * Content-Type 헤더를 먼저 보고, 없으면 UTF-8로 읽어 meta charset을 찾는다.
 */
export function decodeHtml(buf: Uint8Array, contentType?: string | null): string {
  const fromHeader = contentType?.match(CHARSET_RE)?.[1];
  if (fromHeader) {
    const decoded = tryDecode(buf, fromHeader);
    if (decoded !== undefined) return decoded;
  }

  const utf8 = new TextDecoder("utf-8").decode(buf);
  const fromMeta = utf8.match(CHARSET_RE)?.[1];
  if (fromMeta && !/^utf-?8$/i.test(fromMeta)) {
    const decoded = tryDecode(buf, fromMeta);
    if (decoded !== undefined) return decoded;
  }
  return utf8;
}

const NAMED_ENTITY: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * 한글을 숫자 참조로 내보내는 사이트가 있다(실측: jesusfamily.kr의
 * `&#54856; - &#50696;...`). 풀지 않으면 사람이 읽을 수 없어 보고서가 무의미해진다.
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(Number.parseInt(h, 16)),
    )
    .replace(/&(\w+);/g, (m, name: string) => NAMED_ENTITY[name] ?? m);
}

/** `<title>`의 텍스트. 없거나 비어 있으면 undefined */
export function extractTitle(html: string): string | undefined {
  const raw = html.match(TITLE_RE)?.[1];
  if (raw === undefined) return undefined;
  const text = decodeEntities(raw).replace(/\s+/g, " ").trim();
  return text || undefined;
}

/**
 * 호스팅·플랫폼이 돌려주는 안내 페이지의 title.
 *
 * **실측한 것만 넣는다.** 추측으로 넓히면 멀쩡한 교회 홈페이지가 죽은 링크로
 * 몰린다 — 그 플랫폼을 실제로 쓰는 교회의 title에도 업체명이 들어갈 수 있다.
 * 그래서 `카페24`가 아니라 안내 페이지의 고정 문구 `카페24 ::`로 잡는다.
 * 새 사례를 만나면 확인한 뒤 여기에 추가한다.
 */
const PLACEHOLDER: readonly (readonly [RegExp, string])[] = [
  [/^네이버 modoo!?$/i, "네이버 modoo! 안내 — 2025년 6월 서비스 종료"],
  [/^카페24\s*::/i, "카페24 호스팅 안내 — 계정 미설정"],
  // 아래 둘은 2026-09-01 전수 확인에서 나왔다. `홈피닷컴 ::`만으로는 잡지 않는다 —
  // 그 플랫폼을 쓰는 정상 교회의 title도 같은 접두사로 시작하기 때문이다.
  [/^홈피닷컴\s*::\s*Not Found/i, "홈피닷컴 안내 — 페이지 없음"],
  [/^온맘 홈피 중지/, "온맘 안내 — 홈피 중지"],
];

/** 알려진 안내 페이지면 사유를, 아니면 undefined */
export function matchPlaceholder(title: string | undefined): string | undefined {
  if (!title) return undefined;
  for (const [re, label] of PLACEHOLDER) {
    if (re.test(title)) return label;
  }
  return undefined;
}

/**
 * title이 교회명과 두 글자라도 겹치는가.
 *
 * 알려지지 않은 플랫폼의 안내 페이지를 훑어내기 위한 **약한 신호**다.
 * 영문 title을 쓰는 정상 교회도 걸리므로 죽음 판정에 쓰지 않고
 * "사람이 한 번 볼 것" 목록에만 쓴다.
 */
export function titleMatchesName(name: string, title: string | undefined): boolean {
  if (!title) return false;
  for (let i = 0; i + 2 <= name.length; i++) {
    if (title.includes(name.slice(i, i + 2))) return true;
  }
  return false;
}
