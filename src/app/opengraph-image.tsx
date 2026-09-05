// 기본 OG 이미지 — 자기 이미지를 따로 두지 않은 모든 화면(홈·목록·랜딩·정책)이 이걸 쓴다
//
// **국내에서 링크 공유는 카카오톡이 압도적이다.** 미리보기가 비어 있으면 회색 상자만
// 나가므로, 정적 파일 대신 코드로 구워 데이터(수록 건수)까지 반영한다.

import { ImageResponse } from "next/og";
import { getAllChurches } from "@/features/churches/data";
import { OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";
import { BRAND_NAVY, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE_NAME;

export default async function OpengraphImage() {
  const churches = getAllChurches();
  const regions = new Set(churches.map((church) => church.region));

  return new ImageResponse(
    (
      // **Satori는 자식이 둘 이상인 요소에 display를 명시하라고 요구하며, 안 하면 빌드가 죽는다.**
      // `{count}곳 수록`처럼 값과 문자열을 섞어 써도 자식 둘로 세므로, 텍스트는
      // 템플릿 문자열로 합쳐 자식 하나로 만든다
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BRAND_NAVY,
          color: "#fafafa",
          padding: 80,
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>
            {SITE_NAME}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 34,
              lineHeight: 1.45,
              color: "rgba(250,250,250,0.72)",
            }}
          >
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              padding: "10px 24px",
              borderRadius: 999,
              background: "rgba(250,250,250,0.14)",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {`${churches.length}곳 수록`}
          </div>
          <div style={{ fontSize: 30, color: "rgba(250,250,250,0.72)" }}>
            {`${regions.size}개 지역`}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}
