// SDK 주소 조립 단위 테스트 — 빠뜨리면 지도가 통째로 죽는 파라미터 둘을 고정한다

import { describe, expect, it } from "vitest";
import { kakaoSdkUrl } from "./load-kakao";

describe("kakaoSdkUrl", () => {
  const url = () => new URL(kakaoSdkUrl("TEST_KEY"));

  it("앱 키를 쿼리로 넘긴다", () => {
    expect(url().searchParams.get("appkey")).toBe("TEST_KEY");
  });

  /**
   * ⚠️ 기본값(`true`)이면 스크립트가 로드되는 순간 SDK가 스스로 초기화를 시작하는데
   * **그 시점을 알 수 없어** `kakao.maps`가 `undefined`인 채로 다음 줄이 실행된다.
   */
  it("`autoload=false`다 — 준비 완료를 우리가 기다린다", () => {
    expect(url().searchParams.get("autoload")).toBe("false");
  });

  /**
   * ⚠️ 클러스터러는 **로드된 뒤에 추가할 수 없다.** 빠뜨리면 스크립트를 다시 심어야
   * 하고, 2,118건 확장에서는 클러스터링이 없으면 모바일이 버티지 못한다.
   */
  it("`libraries=clusterer`를 처음부터 싣는다", () => {
    expect(url().searchParams.get("libraries")).toBe("clusterer");
  });

  // 카카오 문서의 `//dapi…` 표기를 그대로 쓰면 `file://`에서 깨진다
  it("프로토콜을 생략하지 않는다", () => {
    expect(kakaoSdkUrl("K")).toMatch(/^https:\/\/dapi\.kakao\.com\//);
  });

  it("키에 특수문자가 있어도 인코딩한다", () => {
    expect(new URL(kakaoSdkUrl("a b&c")).searchParams.get("appkey")).toBe(
      "a b&c",
    );
  });
});
