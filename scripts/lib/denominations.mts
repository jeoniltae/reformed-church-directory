// 교단 표기 정규화 — data/denominations.json 판정표를 churches.json에 적용한다
//
// **앱은 이 파일을 쓰지 않는다.** 0단계 결정에 따라 매핑표는 오프라인에만 두고,
// 앱은 이미 구워진 denomination·denominationGroup만 읽는다. 그래서 src/lib이
// 아니라 scripts/lib에 있다 — 계획 문서는 src/lib/church-utils.ts를 적었으나
// 그러면 매핑표가 앱 번들로 딸려 들어갈 길이 열린다.

export type PerChurchOverride = {
  id: string;
  short?: string;
  group?: string;
};

export type DenominationEntry = {
  raw: string;
  short: string;
  group: string;
  perChurch?: PerChurchOverride[];
};

export type DenominationTable = {
  groups: string[];
  entries: DenominationEntry[];
};

export type NormalizedDenomination = {
  /** 배지에 보일 값. 절대 비지 않는다 */
  denomination: string;
  /** 필터에 쓰는 묶음. 판정표에 없으면 키 자체를 넣지 않는다 */
  denominationGroup?: string;
};

/** 빈 문자열은 "교정 없음"으로 본다 — address-fixes.json과 같은 규칙이다 */
function pick(...values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    const trimmed = v?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function buildDenominationIndex(
  table: DenominationTable,
): Map<string, DenominationEntry> {
  return new Map(table.entries.map((e) => [e.raw, e]));
}

/**
 * 원본 교단 표기를 정규화한다.
 *
 * **표에 없으면 undefined를 돌려준다.** 호출부가 경고하고 원본을 그대로 쓰게 하려는
 * 것이다 — 고신 2,118건이 들어오면 표에 없는 표기가 반드시 나오는데, 그때 조용히
 * 비우거나 임의로 묶으면 알아챌 방법이 없다.
 *
 * perChurch는 한 raw 값이 실제로는 서로 다른 교단을 가리킬 때만 있다.
 * 그 안의 빈 값은 "이 교회에 대해서는 따로 정할 것이 없다"는 뜻이라 행 값으로 돌아간다.
 */
export function normalizeDenomination(
  raw: string,
  churchId: string,
  index: Map<string, DenominationEntry>,
): NormalizedDenomination | undefined {
  const key = raw.trim();
  if (!key) return undefined;

  const entry = index.get(key);
  if (!entry) return undefined;

  const override = entry.perChurch?.find((p) => p.id === churchId);
  const denomination = pick(override?.short, entry.short, key);
  if (!denomination) return undefined; // 표에 행은 있는데 short가 비어 있는 경우

  const denominationGroup = pick(override?.group, entry.group);
  return denominationGroup ? { denomination, denominationGroup } : { denomination };
}

/**
 * 판정표 각 행의 `count`·`churches`를 실제 교회 목록으로 맞춘다.
 *
 * **이 두 칸은 사람이 판단하는 값이 아니라 데이터에서 세는 값이다.** 손으로 관리했더니
 * 등록·개명·삭제가 쌓이며 8개 행이 어긋났다(2026-11-02 발견 — 합동 16 → 실제 28).
 * 그래서 import:source가 매번 다시 쓴다. 다른 칸(판정·hint·perChurch)은 건드리지 않는다.
 *
 * `rows`는 제외 목록을 뺀, 교정이 얹힌 원본 표기다. 이미 있던 이름의 순서는 그대로 둔다 —
 * 매번 정렬하면 diff가 실제 변화와 무관하게 커진다.
 */
export function syncChurchLists<
  E extends { raw: string; count?: number; churches?: string[] },
  T extends { entries: E[] },
>(table: T, rows: readonly { name: string; denomination: string }[]): { table: T; changed: string[] } {
  const changed: string[] = [];
  const entries = table.entries.map((e) => {
    const actual = rows.filter((r) => r.denomination.trim() === e.raw).map((r) => r.name);
    const kept = (e.churches ?? []).filter((n) => actual.includes(n));
    const churches = [...kept, ...actual.filter((n) => !kept.includes(n))];
    if (e.count === actual.length && JSON.stringify(e.churches ?? []) === JSON.stringify(churches)) return e;
    changed.push(e.raw);
    return { ...e, count: actual.length, churches };
  });
  return { table: { ...table, entries }, changed };
}
