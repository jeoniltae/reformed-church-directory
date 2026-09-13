// data/ 에 들어가는 값에서 민감정보를 찾아낸다.
//
// **출구가 아니라 입구에서 막는다.** git 이력은 되돌릴 수 없고 포크·클론된
// 사본은 회수할 수 없다 — churches.json에서 지워도 늦다.
//
// 오탐을 내지 않는 쪽에 무게를 뒀다. 정상 전화번호가 걸리면 아무도 이 검사를
// 켜 두지 않게 되고, 그러면 진짜를 놓친다.

export type SensitiveHit = {
  /** 무엇으로 판정했는지. 사람에게 그대로 보여주는 말이다 */
  kind: string;
  /** 값이 있던 JSON 경로 (예: churches[3].phone) */
  path: string;
  /** **가려진 표본.** 원문을 싣지 않는다 — 이 문자열은 터미널과 로그에 남는다 */
  sample: string;
};

/** 주민등록번호: 생년월일 6자리 + 성별코드(1~4) + 6자리 */
const RRN = /\d{6}\s*[-–]\s*[1-4]\d{6}/g;

/** 평문 이메일. 노출하면 스팸 수집 봇의 표적이 된다 — 이 사이트는 이메일을 싣지 않는다 */
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * 카드번호 후보. **4자리 묶음 또는 13~19자리 연속**만 본다.
 * 국내 전화번호는 3-4-4라 여기 걸리지 않는다(`070-8774-9332`).
 */
const CARD = /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{1,4}\b|\b\d{13,19}\b/g;

/** 앞 6자리가 실재하는 월·일인지 본다. 숫자 나열을 주민번호로 오인하지 않으려는 것이다 */
function looksLikeBirthDate(six: string): boolean {
  const month = Number(six.slice(2, 4));
  const day = Number(six.slice(4, 6));
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/** Luhn 검사. 이것이 카드번호 검출의 오탐을 막는 핵심이다 */
function passesLuhn(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function detect(value: string, path: string, hits: SensitiveHit[]): void {
  for (const m of value.matchAll(RRN)) {
    const digits = m[0].replace(/\D/g, "");
    if (!looksLikeBirthDate(digits.slice(0, 6))) continue;
    hits.push({
      kind: "주민등록번호 형식",
      path,
      sample: `${digits.slice(0, 6)}-*******`,
    });
  }

  for (const m of value.matchAll(EMAIL)) {
    const [local, domain] = m[0].split("@");
    hits.push({
      kind: "이메일 주소",
      path,
      sample: `${local.slice(0, 1)}***@${domain}`,
    });
  }

  for (const m of value.matchAll(CARD)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) continue;
    if (!passesLuhn(digits)) continue;
    hits.push({
      kind: "카드번호 형식",
      path,
      sample: `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`,
    });
  }
}

function walk(value: unknown, path: string, hits: SensitiveHit[]): void {
  if (typeof value === "string") {
    detect(value, path || "(전체)", hits);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, hits));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      walk(v, path ? `${path}.${k}` : k, hits);
    }
  }
}

/**
 * 값 안의 모든 문자열을 훑는다. 파싱된 JSON도, 원문 문자열도 받는다 —
 * 훅은 JSON 파싱에 실패하면 원문을 그대로 넘기면 된다.
 */
export function scanSensitive(value: unknown): SensitiveHit[] {
  const hits: SensitiveHit[] = [];
  walk(value, "", hits);
  return hits;
}

/** 사람이 읽을 보고문. CLI와 훅이 같은 문구를 쓰게 한다 */
export function formatHits(hits: readonly SensitiveHit[]): string {
  if (!hits.length) return "";
  const lines = hits.map((h) => `  · ${h.kind} — ${h.path}: ${h.sample}`);
  return [
    `민감정보로 보이는 값 ${hits.length}건을 찾았다. 커밋하면 git 이력에서 지울 수 없다.`,
    ...lines,
  ].join("\n");
}
