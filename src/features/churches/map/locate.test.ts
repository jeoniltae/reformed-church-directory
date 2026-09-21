// 내 위치 실패 판정 단위 테스트 — 사용자가 고칠 수 있는 경우를 잘못 안내하지 않게 고정한다

import { describe, expect, it } from "vitest";
import { locateErrorKind, LOCATE_LEVEL, LOCATE_MESSAGE } from "./locate";

describe("locateErrorKind", () => {
  /**
   * ⚠️ **보안 컨텍스트가 아니면 크롬은 권한을 묻지도 않고 `PERMISSION_DENIED`로 거절한다.**
   * 폰에서 `http://192.168.x.x`로 열었을 때가 그렇다. 그대로 "권한을 허용해 주세요"라고
   * 안내하면 **브라우저 설정을 아무리 만져도 안 되는 일을 시키는 꼴**이다.
   */
  it("보안 연결이 아니면 권한 문제로 읽지 않는다", () => {
    expect(locateErrorKind(false, 1)).toBe("insecure");
    expect(locateErrorKind(false)).toBe("insecure");
  });

  it("보안 연결에서 거절당하면 권한 문제다", () => {
    expect(locateErrorKind(true, 1)).toBe("denied");
  });

  it("그 밖의 실패는 한 가지로 묶는다", () => {
    // 2 = POSITION_UNAVAILABLE · 3 = TIMEOUT · undefined = API 자체가 없음
    expect(locateErrorKind(true, 2)).toBe("failed");
    expect(locateErrorKind(true, 3)).toBe("failed");
    expect(locateErrorKind(true)).toBe("failed");
  });

  it("세 경우 모두 화면에 쓸 문구가 있다", () => {
    for (const kind of ["insecure", "denied", "failed"] as const) {
      expect(LOCATE_MESSAGE[kind]).toBeTruthy();
    }
  });
});

describe("LOCATE_LEVEL", () => {
  /**
   * ⚠️ **클러스터 임계값(`MIN_CLUSTER_LEVEL` = 8)보다 작아야 한다.** 그보다 넓게 잡으면
   * 주변 교회가 묶음 속에 들어가 **마커도 이름표도 안 보인다** — "내 위치로 왔는데
   * 아무것도 없다"가 된다.
   */
  it("묶임이 풀리는 배율이다", () => {
    expect(LOCATE_LEVEL).toBeLessThan(8);
  });
});
