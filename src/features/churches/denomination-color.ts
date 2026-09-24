// 교단 묶음 → 모노그램 색 — 교회명 앞 동그라미가 쓰는 유일한 판정
//
// **컴포넌트에서 빼낸 이유는 화면이 여섯이기 때문이다.** `ChurchCard`(목록·지역
// 랜딩·교단 랜딩)와 `ChurchRow`(홈·지도 시트·가까운 교회)가 같은 표를 봐야 한다 —
// 한쪽만 고치면 **같은 교회가 화면마다 다른 색으로 보인다.**
//
// ⚠️ **색은 보조다. 교단을 말하는 것은 옆의 배지(글자)다.**
// 5색을 서로 구분하려면 밝기 폭이 필요했고(`globals.css`의 토큰 주석), 그 대가로
// **진한 색이 더 중요해 보이는 인상**이 남는다. 배지가 사라지면 이 색도 뺀다 —
// `/about`의 **"평가하거나 순위를 매기지 않습니다"**가 그때 거짓이 되기 때문이다.

/**
 * 묶음 이름 → 클래스.
 *
 * ⚠️ **클래스를 통째로 적는다. 조립하지 않는다.** `` `text-group-${slug}` `` 처럼 만들면
 * **Tailwind가 스캔에서 찾지 못해 그 색이 CSS에 아예 없다** — 화면에서는 색만 조용히
 * 빠지고 에러는 없다.
 *
 * **키는 `Church.denominationGroup`의 값 그대로다**(`data/denominations.json`의 묶음
 * 이름). 순서는 `landing.ts`의 `LANDING_GROUPS`를 따른다.
 */
const GROUP_CLASS: Record<string, string> = {
  "합신 계열": "bg-group-hapsin/12 text-group-hapsin",
  "합동 계열": "bg-group-hapdong/12 text-group-hapdong",
  "고신·고려 계열": "bg-group-gosin/12 text-group-gosin",
  "대신 계열": "bg-group-daesin/12 text-group-daesin",
  "독립·해외": "bg-group-independent/12 text-group-independent",
};

/**
 * 색을 주지 않는 경우의 기본값 — **지금까지의 모노그램 그대로다.**
 *
 * ⚠️ **`기타`에 색을 주지 않는 것은 분류 실패라서가 아니다.** `CLAUDE.md`가
 * **"`기타`는 판정 실패를 뜻하지 않는다 — 상당수가 교단이 확정된 소규모 독자 총회다"**
 * 라고 적어 뒀다. 색을 나눌 만한 **하나의 계열이 아니라서** 비우는 것이고,
 * 교단 표기가 없는 건도 같은 회색을 쓴다.
 */
const NEUTRAL = "bg-muted text-muted-foreground";

/** 모노그램에 입힐 채움·글자 클래스. 표에 없으면 지금까지의 회색 그대로다 */
export function monogramClass(denominationGroup?: string): string {
  if (!denominationGroup) return NEUTRAL;
  return GROUP_CLASS[denominationGroup] ?? NEUTRAL;
}

/** 색을 가진 묶음 이름 전부. **테스트가 판정표와 대조하는 데 쓴다** */
export function coloredGroups(): string[] {
  return Object.keys(GROUP_CLASS);
}
