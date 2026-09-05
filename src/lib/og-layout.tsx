// OG 이미지 공용 레이아웃 — 기본 OG와 교회 상세 OG가 같은 껍데기를 쓴다
//
// **앱 컴포넌트가 아니다.** Satori가 그리는 이미지 전용이라 `src/components/`가 아니라
// 여기 둔다. Tailwind가 아니라 인라인 style만 쓰는 것도 그 때문이다 — Satori는
// 클래스명을 모르고 style 객체만 읽는다.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BRAND_NAVY } from "@/lib/site";

/**
 * OG 이미지 팔레트.
 *
 * **`navy`만 브랜드 토큰과 이어져 있다.** 나머지는 이 이미지 안에서만 쓰는 회색조라
 * `globals.css`에 대응하는 토큰이 없다 — 화면에는 쓰지 않는다.
 */
export const OG_COLORS = {
  navy: BRAND_NAVY,
  bg: "#f7f8fa",
  panel: "#eef1f6",
  grid: "#e3e7ee",
  heading: "#1a2b45",
  body: "#5c6470",
  muted: "#8a919d",
  faint: "#9aa1ad",
  divider: "#e1e5ec",
  pill: "#e8edf4",
  white: "#ffffff",
} as const;

/** 좌측 텍스트 영역 너비. 나머지가 우측 지도 패널이다 */
export const OG_LEFT_WIDTH = 790;
const PANEL_WIDTH = 1200 - OG_LEFT_WIDTH;

/**
 * 로고 마크 — 파비콘과 **같은 파일**(`src/app/icon.png`)을 쓴다.
 *
 * **닮은 그림을 따로 그리지 않는다.** 브라우저 탭과 공유 미리보기에 서로 다른
 * 마크가 뜨면 같은 서비스로 보이지 않는다. 로고를 바꾸면 `icon.png` 하나만
 * 갈아끼우고 `npm run icons:favicon`으로 `.ico`를 다시 뽑으면 둘 다 따라온다.
 *
 * Satori는 파일 경로를 모르므로 data URI로 심는다. 빌드 시점에 한 번 읽어 캐시한다.
 */
let logoDataUri: string | undefined;

function logoMarkSrc(): string {
  logoDataUri ??= `data:image/png;base64,${readFileSync(
    join(process.cwd(), "src/app/icon.png"),
  ).toString("base64")}`;
  return logoDataUri;
}

function LogoMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Satori가 그리는 이미지라 next/image가 아니다
    <img
      src={logoMarkSrc()}
      alt=""
      width={52}
      height={52}
      style={{ borderRadius: 14 }}
    />
  );
}

/** 좌측 상단 로고 락업 — 마크 + 국문명 + 영문명 */
export function OgLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <LogoMark />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 27, fontWeight: 700, color: OG_COLORS.navy }}>
          개혁주의 교회 디렉토리
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: OG_COLORS.faint,
            letterSpacing: 3,
          }}
        >
          REFORMED CHURCH DIRECTORY
        </div>
      </div>
    </div>
  );
}

export interface OgPin {
  /** 패널 왼쪽 위 기준 좌표 */
  x: number;
  y: number;
  size: number;
  /** 채운 핀은 화면당 하나여야 시선이 갈린다 */
  filled?: boolean;
}

function Pin({ x, y, size, filled }: OgPin) {
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex" }}>
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 22s8-6.2 8-12a8 8 0 1 0-16 0c0 5.8 8 12 8 12z"
          fill={filled ? OG_COLORS.navy : OG_COLORS.white}
          stroke={filled ? "none" : OG_COLORS.navy}
          strokeWidth={filled ? 0 : 1.6}
        />
      </svg>
    </div>
  );
}

/**
 * 우측 지도 패널.
 *
 * **격자를 선 하나씩 절대좌표로 긋는다.** Satori에는 `display: grid`가 없고
 * `repeating-linear-gradient`도 기대할 수 없다. 대신 결과가 결정적이라 어긋나지 않는다.
 */
export function OgMapPanel({ pins }: { pins: OgPin[] }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: PANEL_WIDTH,
        height: "100%",
        background: OG_COLORS.panel,
      }}
    >
      {[90, 250, 470].map((top) => (
        <div
          key={`h${top}`}
          style={{
            position: "absolute",
            left: 0,
            top,
            width: PANEL_WIDTH,
            height: 10,
            background: OG_COLORS.grid,
          }}
        />
      ))}
      {[120, 300].map((left) => (
        <div
          key={`v${left}`}
          style={{
            position: "absolute",
            left,
            top: 0,
            width: 10,
            height: 630,
            background: OG_COLORS.grid,
          }}
        />
      ))}
      {pins.map((pin) => (
        <Pin key={`${pin.x}-${pin.y}`} {...pin} />
      ))}
    </div>
  );
}

/** 두 이미지가 공유하는 바깥 껍데기 — 밝은 바탕 + 좌우 2단 */
export function OgFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: OG_COLORS.bg,
        fontFamily: "Pretendard",
      }}
    >
      {children}
    </div>
  );
}
