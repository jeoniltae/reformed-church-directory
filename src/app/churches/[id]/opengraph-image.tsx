// 교회 상세 OG 이미지 — 공유했을 때 어느 교회인지 미리보기에서 바로 보이게 한다
//
// 기본 OG와 **같은 껍데기**를 쓴다(`src/lib/og-layout.tsx`). 우측 지도 패널의 핀은
// 하나만 채워 이 이미지가 특정 교회를 가리킨다는 것을 드러낸다.
//
// **89건이라 빌드 부담이 없다. 2,118건으로 늘면 재검토한다** — 이미지 한 장씩 굽는
// 작업이라 건수에 비례해 빌드가 길어진다. 그때는 기본 OG 하나로 돌리거나
// 상위 교회만 굽는 선택지가 있다.
//
// **랜딩(`/region`·`/denomination`)에는 붙이지 않았다.** 임계값 미만 지역이 요청 시
// 렌더될 수 있는데, 그 시점에 폰트 경로(`node_modules`)가 없을 수 있다. 랜딩은
// 루트의 기본 OG를 그대로 쓴다.

import { ImageResponse } from "next/og";
import { getAllChurchIds, getChurchById } from "@/features/churches/data";
import { decodeRouteParam } from "@/lib/church-utils";
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
export const alt = `${SITE_NAME} 교회 정보`;

/**
 * **이걸 빼면 이미지 라우트가 Dynamic이 되어 요청 때마다 서버에서 굽는다.**
 * 그러면 폰트를 런타임에 읽게 되는데 배포 번들에 `node_modules`의 폰트가
 * 들어간다는 보장이 없다. 페이지와 같은 목록으로 미리 구워 그 위험을 없앤다.
 */
export function generateStaticParams() {
  return getAllChurchIds().map((id) => ({ id }));
}

export default async function ChurchOpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const church = getChurchById(decodeRouteParam((await params).id));

  const place = church?.subRegion
    ? `${church.region} ${church.subRegion}`
    : church?.region;

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

          {church?.denomination && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                marginTop: 52,
                padding: "9px 22px",
                borderRadius: 999,
                background: OG_COLORS.pill,
                fontSize: 24,
                fontWeight: 700,
                color: OG_COLORS.navy,
              }}
            >
              {church.denomination}
            </div>
          )}

          <div
            style={{
              // 배지가 없는 6건은 위가 비므로 그만큼 띄운다
              marginTop: church?.denomination ? 22 : 56,
              fontSize: 68,
              fontWeight: 800,
              color: OG_COLORS.heading,
              letterSpacing: -2,
              lineHeight: 1.2,
              // 이름이 긴 교회가 있어 두 줄까지 허용하고 그 이상은 자른다
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {church?.name ?? SITE_NAME}
          </div>

          {church && (
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontSize: 27,
                color: OG_COLORS.muted,
              }}
            >
              {/* 값과 문자열을 섞으면 자식 둘로 세므로 템플릿 문자열로 합친다 */}
              {`${place} · ${church.pastor} 목사`}
            </div>
          )}

          {church && (
            <div
              style={{
                display: "flex",
                marginTop: 30,
                width: 560,
                height: 1,
                background: OG_COLORS.divider,
              }}
            />
          )}

          {church && (
            <div
              style={{
                marginTop: 24,
                fontSize: 23,
                color: OG_COLORS.body,
                lineHeight: 1.5,
                // 주소가 긴 교회가 있어 한 줄로 자른다
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 1,
                overflow: "hidden",
              }}
            >
              {church.address}
            </div>
          )}
        </div>

        {/* 특정 교회를 가리키는 이미지라 채운 핀 하나만 둔다 */}
        <OgMapPanel
          pins={[
            { x: 168, y: 258, size: 76, filled: true },
            { x: 60, y: 150, size: 30 },
            { x: 330, y: 452, size: 30 },
          ]}
        />
      </OgFrame>
    ),
    { ...size, fonts: ogFonts() },
  );
}
