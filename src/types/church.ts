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
  /** 표시용 메타데이터. 수록 여부를 가르는 기준이 아니다 */
  denomination?: string;
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
}
