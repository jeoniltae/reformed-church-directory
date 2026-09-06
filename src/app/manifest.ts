// 웹 매니페스트 — `/manifest.webmanifest`로 서빙된다
//
// **앱으로 만들려는 게 아니다.** 설치형 PWA는 계획에 없고(`CLAUDE.md`: 앱 없음),
// 홈 화면에 추가했을 때 이름·색이 제대로 뜨게 하는 선까지만 한다.

import type { MetadataRoute } from "next";
import { BRAND_NAVY, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    // 홈 화면 아이콘 아래에 들어가는 이름이라 짧아야 한다 — 길면 잘린다
    short_name: "개혁주의 교회",
    description: SITE_DESCRIPTION,
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: BRAND_NAVY,
    /**
     * **쿼리 없는 경로를 쓴다.** Next는 `<link rel="icon">`에 캐시 무효화용 해시를
     * 붙여(`/icon.png?icon.xxxx.png`) 내보내지만, 해시 없는 경로도 그대로 200이다
     * (2026-09-05 실측). 매니페스트에 해시를 박으면 로고를 바꿀 때마다 값이 달라진다.
     *
     * 512 한 장만 선언한다. 안드로이드가 필요한 크기로 줄여 쓰고, iOS는 매니페스트가
     * 아니라 `apple-icon.png`(`apple-touch-icon`)를 본다.
     */
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
