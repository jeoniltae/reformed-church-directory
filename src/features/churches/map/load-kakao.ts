// Kakao 지도 SDK 로더 — 스크립트를 문서에 한 번만 심고, 준비될 때까지 기다린다

/**
 * SDK 스크립트 주소를 만든다. **순수 함수라 이것만 단위 테스트한다** — 로더 본체는
 * `document`를 만지므로 이 프로젝트의 테스트 대상(유틸 함수)이 아니다.
 *
 * ⚠️ **`autoload=false`가 핵심이다.** 기본값(`true`)이면 스크립트가 로드되는 순간
 * SDK가 스스로 초기화를 시작하는데, **그 시점을 우리가 알 수 없어** `kakao.maps`가
 * 아직 `undefined`인 채로 다음 줄이 실행된다. `false`로 꺼 두고 `kakao.maps.load()`로
 * 완료를 기다린다.
 *
 * ⚠️ **`libraries=clusterer`를 처음부터 싣는다.** 클러스터러는 나중에 얹는 것이
 * 아니라 **2,118건 확장을 전제로 한 필수 요소**이고(`docs/지도-작업.md` 4단계),
 * 로드된 뒤에는 라이브러리를 추가할 수 없어 **스크립트를 다시 심어야 한다.**
 *
 * **프로토콜을 생략하지 않는다.** 카카오 문서의 `//dapi…` 표기는 `file://`에서
 * 깨지고, 우리는 어차피 https만 쓴다.
 */
export function kakaoSdkUrl(appKey: string): string {
  const params = new URLSearchParams({
    appkey: appKey,
    autoload: "false",
    libraries: "clusterer",
  });
  return `https://dapi.kakao.com/v2/maps/sdk.js?${params}`;
}

/** 로더가 실패한 이유 — **화면이 구분해서 말할 수 있어야 한다** */
export type KakaoLoadError =
  /** 환경변수가 비어 있다. 로컬에서 `.env.local`을 안 만든 경우가 대부분이다 */
  | "no-key"
  /** 스크립트를 못 받았다. **도메인 미등록이 가장 흔한 원인이다** */
  | "script-failed";

/**
 * SDK를 불러오고 `kakao.maps`가 준비될 때까지 기다린다.
 *
 * **모듈 레벨에 Promise를 캐시한다.** 지도가 여러 번 마운트돼도(상세 → 목록 → 지도 탭)
 * 스크립트는 한 번만 심긴다. 실패한 Promise는 캐시하지 않아 **다시 시도할 수 있다.**
 *
 * ⚠️ **서버에서 부르지 않는다.** `document`가 없으면 즉시 거절한다 — 이 파일을
 * 서버 컴포넌트에서 import하면 그 자리에서 드러나게 하려는 것이다.
 */
let pending: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (pending) return pending;

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("loadKakaoMaps는 브라우저에서만 부른다"));
      return;
    }

    // 이미 준비돼 있으면 (HMR·중복 마운트) 그대로 쓴다
    if (typeof kakao !== "undefined" && kakao.maps?.load) {
      kakao.maps.load(() => resolve());
      return;
    }

    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) {
      reject(new Error("no-key" satisfies KakaoLoadError));
      return;
    }

    const script = document.createElement("script");
    script.src = kakaoSdkUrl(appKey);
    script.async = true;
    script.onload = () => kakao.maps.load(() => resolve());
    /*
      ⚠️ **도메인 미등록도 여기로 온다.** 카카오는 등록되지 않은 도메인에 스크립트를
      주지 않으므로 증상이 네트워크 실패와 같다. 화면에서 둘을 구분하지 못하니
      **안내 문구는 "지도를 불러오지 못했습니다" 한 가지로 쓴다.**
    */
    script.onerror = () => reject(new Error("script-failed" satisfies KakaoLoadError));
    document.head.appendChild(script);
  });

  // 실패는 캐시하지 않는다 — 다음 마운트에서 다시 시도한다
  pending = promise.catch((error: unknown) => {
    pending = null;
    throw error;
  });

  return pending;
}
