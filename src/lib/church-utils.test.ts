// church-utils 단위 테스트 — 실제 보유 데이터에서 나온 표기 흔들림을 기준으로 삼는다

import { describe, expect, it } from "vitest";
import {
  isSuspectPhone,
  normalizeAddress,
  normalizePhone,
  normalizeRegion,
  normalizeUrl,
  toAddressKeyword,
  toChurchId,
} from "./church-utils";

describe("normalizeRegion", () => {
  it("시도 접미사를 뗀다", () => {
    expect(normalizeRegion("서울시")).toBe("서울");
    expect(normalizeRegion("경기도")).toBe("경기");
    expect(normalizeRegion("강원도")).toBe("강원");
    expect(normalizeRegion("서울특별시")).toBe("서울");
    expect(normalizeRegion("세종시")).toBe("세종");
  });

  it("접미사가 없으면 그대로 둔다", () => {
    expect(normalizeRegion("전북")).toBe("전북");
    expect(normalizeRegion("충북")).toBe("충북");
  });

  it("도로명주소 API의 시도 정식명을 축약형으로 맞춘다", () => {
    // 접미사만 떼면 `충청북`이 되어 보유 데이터의 `충북`과 어긋난다
    expect(normalizeRegion("충청북도")).toBe("충북");
    expect(normalizeRegion("충청남도")).toBe("충남");
    expect(normalizeRegion("경상북도")).toBe("경북");
    expect(normalizeRegion("경상남도")).toBe("경남");
    expect(normalizeRegion("전라북도")).toBe("전북");
    // 전라남도는 통합 명칭으로 가므로 아래 "광주·전남은 통합 명칭으로 모인다"에서 다룬다
  });

  it("특별자치 개편 표기도 같은 값으로 맞춘다", () => {
    expect(normalizeRegion("강원특별자치도")).toBe("강원");
    expect(normalizeRegion("전북특별자치도")).toBe("전북");
    expect(normalizeRegion("제주특별자치도")).toBe("제주");
    expect(normalizeRegion("세종특별자치시")).toBe("세종");
  });

  it("광주·전남은 통합 명칭으로 모인다", () => {
    // 도로명주소 API가 두 지역 모두 `전남광주통합특별시`로 돌려주는 것을 확인했다
    expect(normalizeRegion("전남광주통합특별시")).toBe("전남광주");
    expect(normalizeRegion("광주")).toBe("전남광주");
    expect(normalizeRegion("광주광역시")).toBe("전남광주");
    expect(normalizeRegion("전남")).toBe("전남광주");
    expect(normalizeRegion("전라남도")).toBe("전남광주");
  });

  it("통합 대상이 아닌 지역은 자기 자신으로 유지된다", () => {
    const regions = ["서울","부산","대구","인천","대전","울산","세종",
      "경기","경북","경남","전북","충남","충북","강원"];
    for (const r of regions) expect(normalizeRegion(r)).toBe(r);
  });

  it("접미사를 떼면 한 글자가 되는 경우 원본을 유지한다", () => {
    expect(normalizeRegion("시")).toBe("시");
  });
});

describe("normalizeAddress", () => {
  it("앞에 붙은 우편번호를 뗀다", () => {
    expect(normalizeAddress("121-840 서울시 마포구 서교동 394-25")).toBe(
      "서울시 마포구 서교동 394-25",
    );
  });

  it("우편번호에 공백이 껴 있어도 뗀다", () => {
    expect(normalizeAddress("151- 015 서울시 관악구 조원로120")).toBe(
      "서울시 관악구 조원로120",
    );
  });

  it("번지수를 우편번호로 오인하지 않는다", () => {
    expect(normalizeAddress("서울시 강동구 강일동 69")).toBe(
      "서울시 강동구 강일동 69",
    );
  });

  it("중복 공백을 정리한다", () => {
    expect(normalizeAddress("서울시 관악구 대학동 247-2  3층")).toBe(
      "서울시 관악구 대학동 247-2 3층",
    );
  });
});

describe("toAddressKeyword", () => {
  // 아래 입력은 전부 실제 보유 데이터에서 검색이 실패한 주소다
  it("지번 뒤의 건물명과 층을 잘라낸다", () => {
    expect(toAddressKeyword("서울시 마포구 서교동 394-25 동양트레스빌 B1")).toBe(
      "서울시 마포구 서교동 394-25",
    );
    expect(toAddressKeyword("서울시 서초구 양재동 276-4 선창빌딩6층")).toBe(
      "서울시 서초구 양재동 276-4",
    );
    expect(toAddressKeyword("서울시 송파구 문정동 11-13 태광빌딩2층")).toBe(
      "서울시 송파구 문정동 11-13",
    );
  });

  it("도로명 뒤의 건물명과 호수를 잘라낸다", () => {
    expect(
      toAddressKeyword("서울시 노원구 섬밭로 152, 공릉아파트 2단지 상가 203호"),
    ).toBe("서울시 노원구 섬밭로 152");
    expect(toAddressKeyword("전남 목포시 신흥로 92, 4층")).toBe(
      "전남 목포시 신흥로 92",
    );
  });

  it("괄호 부기를 제거한다", () => {
    expect(
      toAddressKeyword("서울시 동대문구 이문3동 177-68 3층(신이문역 1번출구 근처)"),
    ).toBe("서울시 동대문구 이문3동 177-68");
  });

  it("번지 표기를 잘라낸다", () => {
    expect(
      toAddressKeyword("서울시 노원구 중례4동 445번지 염광아파트상가 3층"),
    ).toBe("서울시 노원구 중례4동 445");
  });

  it("깨진 문자를 제거한다", () => {
    expect(toAddressKeyword("서울 영등포구 ?당산동6가 121-156")).toBe(
      "서울 영등포구 당산동6가 121-156",
    );
  });

  it("이미 깨끗한 주소는 그대로 둔다", () => {
    expect(toAddressKeyword("서울시 강동구 강일동 69")).toBe(
      "서울시 강동구 강일동 69",
    );
    expect(toAddressKeyword("서울시 관악구 조원로120")).toBe(
      "서울시 관악구 조원로120",
    );
  });
});

describe("normalizePhone", () => {
  it("지역번호 형식을 하이픈으로 통일한다", () => {
    expect(normalizePhone("02-428-3578")).toBe("02-428-3578");
    expect(normalizePhone("0708682 3991")).toBe("070-8682-3991");
    expect(normalizePhone("010 5050 5105")).toBe("010-5050-5105");
    expect(normalizePhone("010 4100 7909")).toBe("010-4100-7909");
  });

  it("02 국번 3자리와 4자리를 모두 처리한다", () => {
    expect(normalizePhone("0212345678")).toBe("02-1234-5678");
    expect(normalizePhone("021234567")).toBe("02-123-4567");
  });

  it("050X 안심번호는 앞자리를 네 자리로 끊는다", () => {
    // 실제 보유 데이터에 있는 번호다. 세 자리로 끊으면 형식 이탈로 오판한다
    expect(normalizePhone("0507-1312-5303")).toBe("0507-1312-5303");
    expect(normalizePhone("050713125303")).toBe("0507-1312-5303");
    expect(normalizePhone("0505-123-4567")).toBe("0505-123-4567");
  });

  it("자릿수가 맞지 않으면 임의로 고치지 않고 원본을 돌려준다", () => {
    expect(normalizePhone("010-8993-777")).toBe("010-8993-777");
  });
});

describe("isSuspectPhone", () => {
  it("자릿수가 모자란 번호를 확인 대상으로 표시한다", () => {
    expect(isSuspectPhone("010-8993-777")).toBe(true);
  });

  it("정상 번호는 표시하지 않는다", () => {
    expect(isSuspectPhone("010 5050 5105")).toBe(false);
    expect(isSuspectPhone("02-428-3578")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("스킴이 없으면 http를 붙인다", () => {
    expect(normalizeUrl("cafe.daum.net/hgpch")).toBe(
      "http://cafe.daum.net/hgpch",
    );
  });

  it("기존 스킴은 바꾸지 않는다", () => {
    expect(normalizeUrl("https://example.org/")).toBe("https://example.org/");
    expect(normalizeUrl("http://www.calvary.kr/")).toBe(
      "http://www.calvary.kr/",
    );
  });

  it("빈 값은 빈 문자열로 둔다", () => {
    expect(normalizeUrl("  ")).toBe("");
  });
});

describe("toChurchId", () => {
  it("교회명과 시군구를 잇는다", () => {
    expect(toChurchId("언약교회", "강동구")).toBe("언약교회-강동구");
  });

  it("동명 교회를 시군구로 구분한다", () => {
    expect(toChurchId("언약교회", "강동구")).not.toBe(
      toChurchId("언약교회", "분당구"),
    );
  });

  it("공백과 문장부호를 정리한다", () => {
    expect(toChurchId("서울 진명교회", "관악구")).toBe("서울-진명교회-관악구");
    expect(toChurchId("한길(제2)교회", "광진구")).toBe("한길제2교회-광진구");
  });

  it("시군구가 없으면 교회명만 쓴다", () => {
    expect(toChurchId("죽림교회")).toBe("죽림교회");
  });
});
