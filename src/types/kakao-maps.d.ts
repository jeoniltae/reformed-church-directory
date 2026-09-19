// Kakao 지도 SDK 전역 타입 — **우리가 실제로 쓰는 것만** 좁게 선언한다
//
// **커뮤니티 타입 패키지를 받지 않았다.** 전체 SDK는 표면이 매우 넓은데 이 사이트가
// 쓰는 것은 지도 하나·마커·클러스터러뿐이다. 넓은 타입을 받으면 **없는 기능까지
// 자동완성에 떠서** 나중에 손대는 사람이 쓰게 된다.
//
// ⚠️ `any`**를 쓰지 않는다** (`docs/coding-guidelines.md`). 모르는 인자는 선언하지
// 말고, 필요해지면 그때 이 파일에 한 줄씩 늘린다.

declare namespace kakao.maps {
  /** 위경도 — 우리 `Church.lat`/`lng`가 WGS84라 그대로 넣는다 */
  class LatLng {
    constructor(lat: number, lng: number);
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }

  interface MapOptions {
    center: LatLng;
    /** 작을수록 확대. 1~14 */
    level?: number;
    draggable?: boolean;
    scrollwheel?: boolean;
  }

  interface SetLevelOptions {
    /** 이 좌표를 화면에서 붙잡은 채 확대한다. 누른 자리가 손끝에서 달아나지 않는다 */
    anchor?: LatLng;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void;
    getLevel(): number;
    setLevel(level: number, options?: SetLevelOptions): void;
    relayout(): void;
  }

  interface MarkerOptions {
    position: LatLng;
    title?: string;
    clickable?: boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
  }

  /**
   * 마커 위에 얹는 말풍선. **내용으로 우리가 만든 DOM을 그대로 넣는다** —
   * SDK 기본 `InfoWindow`는 흰 상자 모양이 고정이라 디자인 토큰을 따르지 못한다.
   */
  interface CustomOverlayOptions {
    position: LatLng;
    content: HTMLElement;
    /** 세로 기준점. `1`이면 `content`의 **아래변**이 좌표에 닿는다 */
    yAnchor?: number;
    /** ⚠️ **기본값이 `false`다.** 말풍선 안의 링크를 누르려면 켜야 한다 */
    clickable?: boolean;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }

  /**
   * 마커 묶기. **`libraries=clusterer`로 함께 실어야 존재한다**(`load-kakao.ts`) —
   * 로드된 뒤에는 라이브러리를 추가할 수 없어 스크립트를 다시 심어야 한다.
   */
  interface MarkerClustererOptions {
    map: Map;
    markers: Marker[];
    /**
     * 묶기 시작하는 지도 레벨. **`level >= minLevel`일 때 묶고, 더 확대하면 낱개로 푼다.**
     * 카카오 레벨은 작을수록 확대다(1이 가장 가깝다).
     */
    minLevel: number;
    /** 묶음의 중심을 속한 마커들의 평균으로 잡는다. 끄면 첫 마커 자리에 붙는다 */
    averageCenter?: boolean;
    /** 묶음을 눌렀을 때의 **기본 확대(한 단계)를 끈다.** 우리가 직접 확대하려면 켠다 */
    disableClickZoom?: boolean;
  }

  /** 마커 묶음 하나. `clusterclick` 핸들러가 받는다 */
  interface Cluster {
    getCenter(): LatLng;
  }

  class MarkerClusterer {
    constructor(options: MarkerClustererOptions);
    /** 묶음과 마커를 전부 지운다. 정리(cleanup)는 이것 하나면 된다 */
    clear(): void;
  }

  function load(callback: () => void): void;

  namespace event {
    function addListener(
      target: Marker,
      type: "click",
      handler: () => void,
    ): void;
    /** 지도 빈 곳을 누른 경우. **말풍선을 닫는 유일한 통로다** */
    function addListener(target: Map, type: "click", handler: () => void): void;
    /** 묶음을 누른 경우. `disableClickZoom`을 켜야 우리 확대만 걸린다 */
    function addListener(
      target: MarkerClusterer,
      type: "clusterclick",
      handler: (cluster: Cluster) => void,
    ): void;
  }
}
