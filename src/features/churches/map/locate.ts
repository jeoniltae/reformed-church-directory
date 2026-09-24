// 내 위치 — 브라우저에게 좌표를 묻고, 실패를 사용자가 알아들을 말로 옮긴다
//
// **좌표는 이 브라우저 안에서만 쓴다.** 지도의 중심을 옮기는 데만 쓰고 **어디로도
// 보내지 않는다** — 애초에 이 사이트에는 받을 서버가 없다(`/privacy`에 명시).
//
// ⚠️ **실패를 세 가지로 가른다.** "안 됐다"만 알리면 사용자가 할 수 있는 일이 없는데,
// **셋 중 둘은 고칠 수 있는 종류**다. 지도 로더가 `no-key`와 `script-failed`를 구분한
// 것과 같은 판단이고, 그쪽과 달리 **여기서는 화면 문구도 갈린다**(증상이 다르다).

/**
 * 위치를 찾은 뒤 보여줄 확대 단계.
 *
 * ⚠️ **클러스터 임계값(8)보다 작아야 한다.** 그보다 넓게 잡으면 주변 교회가 묶음 속에
 * 들어가 **마커도 이름표도 안 보인다** — "내 위치로 왔는데 아무것도 없다"가 된다.
 * 5는 축척 250m로 동네를 보는 배율이다.
 */
export const LOCATE_LEVEL = 5;

/** 위치 요청 옵션 — 정밀도보다 **빨리 답하는 것**이 중요하다 */
export const LOCATE_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  /** 1분 안에 받아 둔 값이 있으면 그대로 쓴다. 버튼을 다시 눌렀을 때 즉시 반응한다 */
  maximumAge: 60_000,
};

/** 왜 못 찾았나. **사용자가 고칠 수 있는 것부터 가른다** */
export type LocateError = "insecure" | "denied" | "failed";

/**
 * 실패 원인을 고른다.
 *
 * ⚠️ **`insecure`를 먼저 본다.** 크롬은 **보안 컨텍스트가 아니면**(예: 폰에서
 * `http://192.168.x.x`로 열었을 때) 권한을 묻지도 않고 **`PERMISSION_DENIED`로 거절한다.**
 * 그대로 "권한을 허용해 주세요"라고 안내하면 **사용자가 고칠 수 없는 일을 시키는 꼴**이다
 * — 브라우저 설정을 아무리 만져도 안 된다.
 *
 * @param secure `window.isSecureContext`
 * @param code `GeolocationPositionError.code` (없으면 `undefined`)
 */
export function locateErrorKind(
  secure: boolean,
  code?: number,
): LocateError {
  if (!secure) return "insecure";
  // 1 === PERMISSION_DENIED. 상수를 쓰지 않는 것은 서버에서도 부를 수 있게 하기 위해서다
  if (code === 1) return "denied";
  return "failed";
}

/** 화면에 그대로 나가는 문구. **안내지 경고가 아니다** — 붉은색을 쓰지 않는다 */
export const LOCATE_MESSAGE: Record<LocateError, string> = {
  insecure: "보안 연결(https)에서만 현재 위치를 쓸 수 있습니다.",
  denied: "브라우저에서 위치 권한을 허용해 주세요.",
  failed: "현재 위치를 확인하지 못했습니다.",
};
