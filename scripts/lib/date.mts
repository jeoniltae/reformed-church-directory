// 데이터 파일에 남기는 날짜를 만든다 — 한국 시간 기준

/**
 * 오늘 날짜를 `YYYY-MM-DD`로 돌려준다.
 *
 * **`new Date().toISOString().slice(0, 10)`을 쓰지 않는다.** 그쪽은 UTC라
 * 한국 시간 오전 9시 이전에 스크립트를 돌리면 **하루 전 날짜가 기록된다.**
 * 실제로 `excluded.json`의 접수일과 `geocode.json`의 조회일이 그렇게 남았다.
 *
 * `sv-SE` 로케일을 쓰는 이유는 그것이 `YYYY-MM-DD` 형식을 주기 때문이다 —
 * `ko-KR`은 `2026. 9. 17.`처럼 점과 공백이 섞인 값을 준다.
 */
export function todayInSeoul(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now);
}
