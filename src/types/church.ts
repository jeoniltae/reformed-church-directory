// 교회 데이터의 공통 타입 — 크롤러가 생성하고 앱이 읽는 유일한 데이터 계약

export interface Church {
  /** URL에 쓰이는 식별자. 교회명+시군구 기반이며 충돌 시 번호가 붙는다 */
  id: string;
  name: string;
  /** 시도 단위. `서울`, `경기` 등 접미사를 뗀 형태로 정규화한다 */
  region: string;
  /** 시군구 단위 */
  subRegion?: string;
  address: string;
  pastor: string;
  /** 배지에 보이는 총회 이름. 표시용 메타데이터이며 수록 여부를 가르는 기준이 아니다 */
  denomination?: string;
  /**
   * 필터·집계에 쓰는 묶음. `denomination`과 나눠 둔 덕에 별개 총회를 같은 묶음에
   * 담을 수 있다(예: 고려는 고신과 다른 총회지만 `고신·고려 계열`이다).
   * 값은 `data/denominations.json`의 `groups` 6종뿐이다.
   */
  denominationGroup?: string;
  phone?: string;
  homepage?: string;
  /** 도로명주소 API로 확보 예정 */
  lat?: number;
  lng?: number;
  /** 개별 교회 홈페이지 2차 수집으로 보강 예정 */
  worshipTimes?: string[];
  sns?: string[];
  /** 상세 페이지 출처 표기에 사용한다 */
  source: string;
  /**
   * 이 교회 데이터에 **알려진 한계**가 있을 때 상세 화면에 띄우는 안내.
   *
   * 원본은 `data/notices.json`이고 `import-source`가 얹는다. 앱은 구워진 값만 읽는다.
   * 여기 값이 있다는 것은 "우리가 확인하지 못했다"는 뜻이지 교회에 문제가 있다는
   * 뜻이 아니다 — 문구도 화면도 그 구분을 지켜야 한다.
   */
  notice?: {
    /** 무엇을 확인하지 못했는지 한 문장. 화면에 그대로 나간다 */
    message: string;
    /** 이용자가 대신 확인할 수 있는 창구가 **실제로 있을 때만** 넣는다 */
    contact?: { label: string; phone: string };
  };
}
