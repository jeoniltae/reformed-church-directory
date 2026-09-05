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
    // icons는 아이콘 파일(6-2-8)이 준비되면 채운다. 지금 없는 경로를 적으면
    // 매니페스트를 읽는 쪽에서 404가 난다 — 비워두면 favicon으로 폴백한다
  };
}
