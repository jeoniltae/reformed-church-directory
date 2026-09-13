// sensitive.mts 단위 테스트
//
// **오탐 테스트가 검출 테스트만큼 중요하다.** 정상 전화번호가 걸리기 시작하면
// 아무도 이 검사를 켜 두지 않고, 그러면 진짜를 놓친다.

import { describe, expect, it } from "vitest";
import { formatHits, scanSensitive } from "./sensitive.mts";

const kinds = (v: unknown) => scanSensitive(v).map((h) => h.kind);

describe("scanSensitive — 주민등록번호", () => {
  it("찾아내고 뒷자리를 가린다", () => {
    const hits = scanSensitive({ note: "담당자 900101-1234567" });
    expect(hits).toEqual([
      { kind: "주민등록번호 형식", path: "note", sample: "900101-*******" },
    ]);
  });

  it("공백이 섞인 표기도 잡는다", () => {
    expect(kinds("900101 - 1234567")).toContain("주민등록번호 형식");
  });

  it("실재하지 않는 월·일은 주민번호로 보지 않는다", () => {
    expect(kinds("991301-1234567")).toEqual([]); // 13월
    expect(kinds("990199-1234567")).toEqual([]); // 99일
  });

  it("성별코드 자리가 5~9면 잡지 않는다", () => {
    expect(kinds("900101-9234567")).toEqual([]);
  });
});

describe("scanSensitive — 이메일", () => {
  it("찾아내고 계정명을 가린다", () => {
    expect(scanSensitive({ contact: "문의 pastor@example.or.kr" })).toEqual([
      { kind: "이메일 주소", path: "contact", sample: "p***@example.or.kr" },
    ]);
  });

  it("mailto: 링크도 잡는다", () => {
    expect(kinds("mailto:info@church.kr")).toContain("이메일 주소");
  });
});

describe("scanSensitive — 카드번호", () => {
  it("Luhn을 통과하는 16자리를 잡고 뒤 4자리만 남긴다", () => {
    expect(scanSensitive({ memo: "4111 1111 1111 1111" })).toEqual([
      { kind: "카드번호 형식", path: "memo", sample: "************1111" },
    ]);
  });

  it("Luhn을 통과하지 못하면 잡지 않는다", () => {
    expect(kinds("4111 1111 1111 1112")).toEqual([]);
  });
});

// 이 블록이 깨지면 도구 전체가 못 쓰게 된다.
describe("scanSensitive — 오탐 방지", () => {
  it("국내 전화번호를 잡지 않는다", () => {
    const phones = [
      "02-428-3578",
      "070-8774-9332",
      "031-000-0000",
      "010-1234-5678",
      "063-445-5645",
      "0505-123-4567",
    ];
    for (const p of phones) expect(kinds(p), p).toEqual([]);
  });

  it("도로명주소 API의 코드값을 잡지 않는다", () => {
    // admCd(10) · rnMgtSn(12) — 둘 다 13자리 미만이라 카드 후보가 되지 않는다
    expect(kinds({ admCd: "4145010200", rnMgtSn: "414502202001" })).toEqual([]);
  });

  it("주소·교회명 같은 평범한 값을 잡지 않는다", () => {
    expect(
      kinds({
        name: "언약교회",
        address: "경기도 하남시 하남대로 412 (하산곡동)",
        zipNo: "13025",
      }),
    ).toEqual([]);
  });

  it("숫자 타입은 훑지 않는다 — 좌표가 걸리지 않는다", () => {
    expect(kinds({ lat: 37.511378, lng: 127.226301 })).toEqual([]);
  });
});

describe("scanSensitive — 경로", () => {
  it("배열과 중첩 객체의 위치를 짚어 준다", () => {
    const hits = scanSensitive({
      churches: [{ name: "가교회" }, { notice: { message: "900101-1234567" } }],
    });
    expect(hits[0].path).toBe("churches[1].notice.message");
  });

  it("파싱되지 않은 원문 문자열도 받는다", () => {
    expect(scanSensitive("900101-1234567")[0].path).toBe("(전체)");
  });
});

describe("formatHits", () => {
  it("아무것도 없으면 빈 문자열이다", () => {
    expect(formatHits([])).toBe("");
  });

  it("건수와 경로를 한 덩어리로 만든다", () => {
    const out = formatHits(scanSensitive({ note: "900101-1234567" }));
    expect(out).toContain("1건");
    expect(out).toContain("note: 900101-*******");
    // 원문이 새어 나가지 않아야 한다
    expect(out).not.toContain("1234567");
  });
});
