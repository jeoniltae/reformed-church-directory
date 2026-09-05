// 교회 상세 OG 이미지 — 공유했을 때 어느 교회인지 미리보기에서 바로 보이게 한다
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
import { BRAND_NAVY, SITE_NAME } from "@/lib/site";

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
          {church?.denomination && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                padding: "8px 20px",
                borderRadius: 999,
                background: "rgba(250,250,250,0.14)",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {church.denomination}
            </div>
          )}
          <div
            style={{
              marginTop: 28,
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: -2,
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
                marginTop: 20,
                fontSize: 34,
                color: "rgba(250,250,250,0.72)",
              }}
            >
              {`${place} · ${church.pastor} 목사`}
            </div>
          )}
        </div>

        <div style={{ fontSize: 30, color: "rgba(250,250,250,0.62)" }}>
          {SITE_NAME}
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts() },
  );
}
