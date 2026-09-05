// 기본 OG 이미지 — 자기 이미지를 따로 두지 않은 모든 화면(홈·목록·랜딩·정책)이 이걸 쓴다
//
// **국내에서 링크 공유는 카카오톡이 압도적이다.** 미리보기가 비어 있으면 회색 상자만
// 나가므로, 정적 파일 대신 코드로 구워 데이터(수록 건수)까지 반영한다.
//
// 껍데기·팔레트·지도 패널은 `src/lib/og-layout.tsx`에서 교회 상세 OG와 공유한다.

import { ImageResponse } from "next/og";
import { getAllChurches } from "@/features/churches/data";
import { OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";
import {
  OG_COLORS,
  OG_LEFT_WIDTH,
  OgFrame,
  OgLogo,
  OgMapPanel,
} from "@/lib/og-layout";
import { SITE_NAME } from "@/lib/site";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = SITE_NAME;

export default async function OpengraphImage() {
  const count = getAllChurches().length;

  return new ImageResponse(
    (
      <OgFrame>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: OG_LEFT_WIDTH,
            padding: 64,
          }}
        >
          <OgLogo />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 56,
              fontSize: 66,
              fontWeight: 800,
              color: OG_COLORS.heading,
              lineHeight: 1.22,
              letterSpacing: -2,
            }}
          >
            <div>오늘, 어디로</div>
            <div>예배하러 가시나요?</div>
          </div>

          {/*
            **Satori는 자식이 둘 이상인 요소에 display를 명시하라고 요구하며, 없으면
            빌드가 죽는다.** 한 줄 안에서 색·굵기를 바꾸려면 이렇게 flex 아이템으로
            쪼개야 하고, 아이템 사이 공백은 사라지므로 `&nbsp;`로 직접 넣는다.
          */}
          <div
            style={{
              display: "flex",
              marginTop: 34,
              fontSize: 27,
              color: OG_COLORS.muted,
            }}
          >
            <div>흩어진&nbsp;</div>
            <div style={{ fontWeight: 700, color: OG_COLORS.navy }}>
              개혁주의
            </div>
            <div>&nbsp;교회 정보를 한곳에 모았습니다.</div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 30,
              width: 560,
              height: 1,
              background: OG_COLORS.divider,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 26,
              fontSize: 23,
              color: OG_COLORS.body,
              lineHeight: 1.5,
            }}
          >
            <div>교회명·주소·담임목사로 찾고,</div>
            {/* 값과 문자열을 섞으면 자식 둘로 세므로 템플릿 문자열로 합친다 */}
            <div>{`전국 개혁주의 교회 ${count}곳을 수록했습니다.`}</div>
          </div>
        </div>

        <OgMapPanel
          pins={[
            { x: 100, y: 150, size: 44, filled: true },
            { x: 300, y: 268, size: 36 },
            { x: 165, y: 424, size: 36 },
            { x: 345, y: 470, size: 36 },
          ]}
        />
      </OgFrame>
    ),
    { ...size, fonts: ogFonts() },
  );
}
