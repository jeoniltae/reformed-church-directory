// OG 이미지 공용 설정 — 규격과 한글 폰트 로딩

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** 1200×630. 카카오톡·트위터·페이스북이 공통으로 받는 규격이다 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * **Satori(`ImageResponse`)는 woff2를 읽지 못한다.** 앱이 쓰는 Variable woff2 대신
 * 같은 패키지의 정적 woff를 읽는다. 폰트를 넘기지 않으면 한글이 통째로 빈 네모가 된다.
 *
 * **빌드 시점에만 읽혀야 한다.** 배포 번들에 `node_modules`의 이 폰트가 들어간다는
 * 보장이 없어서, 런타임에 읽으면 OG가 통째로 깨질 수 있다. 그래서
 * `churches/[id]/opengraph-image.tsx`는 **`generateStaticParams`를 반드시 들고 있어야
 * 한다** — 빼면 이미지 라우트가 Dynamic으로 떨어져 요청 때마다 여기를 읽는다
 * (빌드 로그에서 `ƒ`로 확인된다). 지역·교단 랜딩에 OG를 붙이지 않은 것도 같은 이유다:
 * 임계값 미만 지역은 요청 시 렌더될 수 있다.
 */
const FONT_DIR = "node_modules/pretendard/dist/web/static/woff";

const WEIGHTS = [
  [400, "Regular"],
  [500, "Medium"],
  [700, "Bold"],
  [800, "ExtraBold"],
] as const;

/**
 * 한 번 읽어 재사용한다. **교회 상세 OG가 89장이라 매번 읽으면 같은 파일을
 * 89번씩 다시 연다** — 굵기 4종이면 한 장당 4.4MB다.
 */
let cached: ReturnType<typeof read> | undefined;

function read() {
  return WEIGHTS.map(([weight, name]) => ({
    name: "Pretendard",
    data: readFileSync(join(process.cwd(), FONT_DIR, `Pretendard-${name}.woff`)),
    weight,
    style: "normal" as const,
  }));
}

export function ogFonts() {
  cached ??= read();
  return cached;
}
