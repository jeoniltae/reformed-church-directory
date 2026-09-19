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

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void;
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

  function load(callback: () => void): void;

  namespace event {
    function addListener(
      target: Marker,
      type: "click",
      handler: () => void,
    ): void;
  }
}
