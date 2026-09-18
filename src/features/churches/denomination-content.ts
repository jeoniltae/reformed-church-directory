// 교단 해설 원고 조회 — `data/denomination-content.json`을 읽는 유일한 지점 (서버 전용)
//
// **`data/denominations.json`을 앱이 직접 읽지 않는다.** 그쪽은 내부 판정표라
// `hint`에 `추정:` 같은 작업 메모가 들어 있고, `entries[].churches`의 교회명 배열까지
// 합쳐 28KB다. CLAUDE.md가 *"매핑표는 앱 번들에 들어가지 않는다"*고 못 박은 파일이다.
// 화면에 나갈 문장만 추린 작은 파일을 따로 두고 여기서 읽는다.
//
// **건수는 이 파일에 없다.** `churches.json`에서 실시간으로 센다 — 원고에 숫자를
// 박아 두면 교회가 늘고 줄 때마다 문구가 조용히 거짓이 된다.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** 한 총회의 공개용 정보. 화면에 그대로 나간다 */
export interface SynodContent {
  /**
   * **`churches.json`에 실리는 `denomination`(short) 값이다.**
   * 판정표의 `raw`가 아니다 — 화면 집계가 short 기준이라 어긋나면 건수가 0으로 나온다.
   */
  denomination: string;
  /** 정식 표기. `대한예수교장로회(고신)` 같은 쿼리를 받는 자리다 */
  official: string;
  /**
   * 채택한 신앙고백. **근거가 없으면 `null`이고 화면은 그 행을 그리지 않는다.**
   * 2차 자료의 "거의 모든 장로교단은 웨스트민스터"로 채우지 않는다 — 대륙 3형식을
   * 함께 쓰는 교단이 그 일반화에서 지워진다(CLAUDE.md).
   */
  confession: string | null;
  /** 창립·분립 연도 등 짧은 사실. 없으면 빈 문자열 */
  note: string;
  /** 그 행의 근거. 검수 때 "이 문장이 어디서 왔나"가 보여야 한다 */
  sourceUrl: string;
}

export interface GroupContent {
  /** 계열 설명 2~3문장. **아직 안 쓴 계열은 빈 문자열이고 화면은 그 문단을 건너뛴다** */
  lead: string;
  synods: SynodContent[];
}

interface ContentFile {
  groups: Record<string, GroupContent>;
  ungrouped: GroupContent;
}

const content: ContentFile = JSON.parse(
  readFileSync(join(process.cwd(), "data/denomination-content.json"), "utf8"),
);

/**
 * 계열 하나의 원고. 랜딩이 있는 5개 묶음만 여기 있다.
 *
 * **없는 묶음에 `undefined`를 돌려준다** — `기타`가 그렇다. 랜딩이 없어 이 함수로
 * 찾을 일이 없고, 그 내용은 `ungroupedContent()`가 맡는다.
 */
export function groupContent(group: string): GroupContent | undefined {
  return content.groups[group];
}

/** 계열로 묶지 않은 교단들(`기타`)의 원고. `/denomination` 허브가 쓴다 */
export function ungroupedContent(): GroupContent {
  return content.ungrouped;
}

/** 원고에 등재된 모든 총회 — 커버리지 검사가 쓴다 */
export function allSynods(): SynodContent[] {
  return [
    ...Object.values(content.groups).flatMap((g) => g.synods),
    ...content.ungrouped.synods,
  ];
}
