// 교단 묶음 → 모노그램 색 — 교회명 앞 동그라미가 쓰는 유일한 판정
//
// **컴포넌트에서 빼낸 이유는 화면이 여섯이기 때문이다.** `ChurchCard`(목록·지역
// 랜딩·교단 랜딩)와 `ChurchRow`(홈·지도 시트·가까운 교회)가 같은 표를 봐야 한다 —
// 한쪽만 고치면 **같은 교회가 화면마다 다른 색으로 보인다.**
//
// ⚠️ **글자에 색을 넣지 않는다 — 채움만 물들인다** (2026-09-24, 실측으로 되돌렸다).
// 처음에는 `채움 12% + 색 글자`였는데 **글자 대비가 기준 아래로 떨어졌다.** 흰 바탕
// 위 실측에서 합동 **2.29:1** · 독립 **2.54:1**로, 본문 기준(4.5:1)은커녕 **3:1도 못
// 넘겼다**(변경 전 회색 모노그램은 4.34:1이었다).
//
// **원인은 팔레트가 아니라 구조다.** 5색을 구분하려면 밝기 폭 0.48~0.72가 필요한데,
// **밝은 쪽은 흰 바탕에서 대비가 나올 수 없다.** 흰 바탕에서 `색 글자`·`충분한 대비`·
// `5색 구분` 셋은 동시에 성립하지 않는다.
//
// 글자를 `text-foreground`로 두면 대비가 **최저 9.97:1**로 구조적으로 보장된다.
// ⚠️ **대신 색은 더 약해졌다** — 25% 채움끼리의 차이는 CVD ΔE 3.0 · 정상시력 4.4로,
// **나란히 놓으면 다르다는 것은 보이지만 색만으로 계열을 알아볼 수는 없다.**
// 그래도 되는 이유가 바로 아래 문장이다.
//
// ⚠️ **색은 보조다. 교단을 말하는 것은 옆의 배지(글자)다.** 배지가 사라지면 이 색도
// 뺀다 — `/about`의 **"평가하거나 순위를 매기지 않습니다"**가 그때 거짓이 되기 때문이다.
// 채움끼리 밝기가 조금 다른 것(`globals.css`의 토큰 주석)도 같은 이유로 견딜 수 있다:
// **25% 틴트에서는 그 차이가 서열로 읽힐 만큼 크지 않고, 읽는 것은 배지다.**

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
  "합신 계열": "bg-group-hapsin/25 text-foreground",
  "합동 계열": "bg-group-hapdong/25 text-foreground",
  "고신·고려 계열": "bg-group-gosin/25 text-foreground",
  "대신 계열": "bg-group-daesin/25 text-foreground",
  "독립·해외": "bg-group-independent/25 text-foreground",
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
