// 교회 데이터 편집의 순수 로직. 파일을 읽지도 쓰지도 않는다 —
// "현재 문서 + 인자 → 새 문서"만 계산하므로 단위 테스트로 전부 고정된다.
//
// **churches.json을 직접 만들지 않는다.** 여기서 고치는 것은 사람이 손대는
// 오버레이 파일들이고, 결과물은 import:source가 다시 굽는다.

import type { AdditionRow, Fix, SourceRow } from "./source.mts";

/**
 * 최상위의 note·fields·주의 같은 설명 키를 잃지 않도록 나머지를 그대로 들고 다닌다.
 * 이 설명들이 파일의 사용법이라 지우면 다음 사람이 형식을 알 수 없다.
 */
type Doc<K extends string, T> = Record<string, unknown> & { [P in K]: T[] };

export type FixEntry = Fix & {
  church?: string;
  original?: string;
  phoneHint?: string;
  pastorHint?: string;
  homepageHint?: string;
  note?: string;
};
export type FixPatch = Partial<Omit<FixEntry, "id">>;
export type AddressFixesDoc = Doc<"fixes", FixEntry>;

export type AdditionEntry = AdditionRow & {
  addedAt?: string;
  sourceNote?: string;
};
export type AdditionsDoc = Doc<"churches", AdditionEntry>;

export type ExcludedEntry = { id: string; reason?: string; requestedAt?: string };
export type ExcludedDoc = Doc<"churches", ExcludedEntry>;

export type NoticeEntry = {
  id: string;
  message: string;
  contact?: { label: string; phone: string };
  reason?: string;
};
export type NoticesDoc = Doc<"notices", NoticeEntry>;

/** 기존 데이터 파일과 같은 모양 — 들여쓰기 2, 끝에 개행. diff를 조용히 유지한다 */
export function serialize(doc: unknown): string {
  return JSON.stringify(doc, null, 2) + "\n";
}

// ── 대상 찾기 ────────────────────────────────────────────────────────────

export type ResolveResult =
  | { status: "ok"; row: SourceRow }
  | { status: "ambiguous"; matches: SourceRow[] }
  | { status: "notFound" };

/**
 * 교회명·출력 id·조회용 id 어느 쪽으로 찾아도 되게 한다.
 *
 * **정확히 일치하는 것을 먼저 본다.** 부분 일치를 먼저 보면 `사랑교회`가
 * `사랑의교회`까지 끌고 와서 후보가 둘이 되고, 정작 이름이 정확한 교회를 못 고른다.
 */
export function resolveTarget(
  rows: readonly SourceRow[],
  query: string,
): ResolveResult {
  const q = query.trim();
  if (!q) return { status: "notFound" };

  const pick = (matches: SourceRow[]): ResolveResult | undefined => {
    if (matches.length === 1) return { status: "ok", row: matches[0] };
    if (matches.length > 1) return { status: "ambiguous", matches };
    return undefined;
  };

  return (
    pick(rows.filter((r) => r.id === q || r.lookupId === q)) ??
    pick(rows.filter((r) => r.name === q)) ??
    pick(
      rows.filter(
        (r) => r.name.includes(q) || r.id.includes(q) || r.lookupId.includes(q),
      ),
    ) ?? { status: "notFound" }
  );
}

// ── 오버레이 갱신 ────────────────────────────────────────────────────────

/** 새 행을 만들 때의 키 순서. address-fixes.json의 fields 설명과 같은 차례다 */
const FIX_KEY_ORDER: readonly (keyof FixEntry)[] = [
  "id",
  "church",
  "original",
  "corrected",
  "phoneHint",
  "phoneCorrected",
  "pastorHint",
  "pastorCorrected",
  "homepageHint",
  "homepageCorrected",
  "nameCorrected",
  "subRegionCorrected",
  "regionCorrected",
  "note",
];

function defined<T extends object>(patch: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/**
 * **키는 반드시 조회용 id(lookupId)다.** churches.json의 id를 넣으면 이미
 * 개명·이전한 교회에서 조용히 빗나가 교정이 아예 반영되지 않는다.
 *
 * 기존 행은 키 순서를 그대로 두고 값만 덮는다 — 사람이 쓴 파일이라 재배열하지 않는다.
 */
export function upsertFix(
  doc: AddressFixesDoc,
  lookupId: string,
  patch: FixPatch,
): AddressFixesDoc {
  const clean = defined(patch);
  const index = doc.fixes.findIndex((f) => f.id === lookupId);

  let fixes: FixEntry[];
  if (index === -1) {
    const created: FixEntry = { id: lookupId };
    for (const key of FIX_KEY_ORDER) {
      if (key === "id") continue;
      const v = (clean as Record<string, unknown>)[key];
      if (v !== undefined) (created as Record<string, unknown>)[key] = v;
    }
    fixes = [...doc.fixes, created];
  } else {
    fixes = doc.fixes.map((f, i) => (i === index ? { ...f, ...clean } : f));
  }

  return { ...doc, fixes };
}

/** 신규 등록은 CSV 뒤에 쌓인다. 중복 판정은 buildRows가 하므로 여기서는 하지 않는다 */
export function appendAddition(
  doc: AdditionsDoc,
  row: AdditionEntry,
): AdditionsDoc {
  return { ...doc, churches: [...doc.churches, row] };
}

/** 같은 id를 두 번 넣지 않는다 — 두 번 제외해도 결과는 같지만 목록이 지저분해진다 */
export function appendExclusion(
  doc: ExcludedDoc,
  id: string,
  reason: string,
  requestedAt: string,
): ExcludedDoc {
  const entry: ExcludedEntry = { id, reason, requestedAt };
  const index = doc.churches.findIndex((c) => c.id === id);
  const churches =
    index === -1
      ? [...doc.churches, entry]
      : doc.churches.map((c, i) => (i === index ? { ...c, ...entry } : c));
  return { ...doc, churches };
}

export function upsertNotice(doc: NoticesDoc, entry: NoticeEntry): NoticesDoc {
  const index = doc.notices.findIndex((n) => n.id === entry.id);
  const notices =
    index === -1
      ? [...doc.notices, entry]
      : doc.notices.map((n, i) => (i === index ? { ...n, ...entry } : n));
  return { ...doc, notices };
}

// ── id 변경의 연쇄 ───────────────────────────────────────────────────────

/** 사이트 공개일. 이전에만 존재한 id는 색인된 적이 없어 리다이렉트가 필요 없다 */
export const PUBLISHED_AT = "2026-09-06";

/**
 * 교회명·시군구를 고치면 id가 바뀌고 네 곳이 함께 움직인다.
 * 하나라도 빠뜨리면 **빌드는 통과하고 증상만 남는다** — 좌표가 사라지거나 404다.
 */
export function idChangeChecklist(oldId: string, newId: string): string[] {
  const source = encodeURI(`/churches/${oldId}`);
  const destination = encodeURI(`/churches/${newId}`);
  return [
    `상세 URL이 /churches/${oldId} → /churches/${newId}로 바뀐다.`,
    `data/geocode.json — entries[].id가 '${oldId}'로 남아 있으면 주소·좌표가 통째로 반영되지 않는다. npm run normalize:addresses -- --only=<교회명> 뒤에 npm run geocode:coords를 다시 돌린다.`,
    `data/notices.json — '${oldId}' 행이 있으면 '${newId}'로 고친다. 안 고치면 안내가 조용히 사라진다.`,
    `data/excluded.json — '${oldId}' 행이 있으면 '${newId}'로 고친다.`,
    `next.config.ts의 redirects()에 아래를 추가한다. source·destination 모두 인코딩된 문자열 그대로 쓴다 — 한글 원문을 쓰면 빌드는 통과하고 404만 남는다.`,
    `      {`,
    `        // /churches/${oldId} → /churches/${newId}`,
    `        source: "${source}",`,
    `        destination: "${destination}",`,
    `        permanent: true,`,
    `      },`,
    `다만 '${oldId}'가 공개일(${PUBLISHED_AT}) 이전에만 존재했다면 색인된 적이 없으므로 리다이렉트를 넣지 않는다.`,
  ];
}
