import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { JsonLd } from "@/components/shared/JsonLd";
import { siteJsonLd } from "@/lib/json-ld";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Geist는 라틴 전용이라 한글 글리프가 없다. `pretendard` npm 패키지의 Variable
// woff2를 직접 자체 호스팅한다 — 외부 CDN 요청을 만들지 않는다는 이 프로젝트의
// 기존 방침(분석 도구·쿠키 없음)과 같은 이유다. weight 45–920은 패키지가
// 선언한 실제 가변 축 범위이고, Tailwind의 font-medium/semibold/bold(500/600/700)가
// 이 범위 안에서 그대로 보간된다.
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // OG 이미지는 `app/opengraph-image.tsx`가 자동으로 붙는다. 여기 images를 또 쓰면
  // 두 벌이 나가므로 쓰지 않는다. 교회 상세는 자기 opengraph-image로 덮어쓴다
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  /**
   * **`robots.ts`의 전면 차단과 다른 층위다.** robots.txt는 "긁지 마라"이고
   * 이 메타는 "긁었으면 색인해도 된다"이다. 지금은 크롤 자체가 막혀 있어 이 값이
   * 읽히지 않지만, 6-4-7에서 문을 열면 그날부터 바로 유효해진다.
   */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${pretendard.variable} h-full antialiased`}
    >
      {/* pb-16은 고정된 하단 탭바가 마지막 콘텐츠를 가리지 않게 하는 여백이다 */}
      <body className="min-h-full flex flex-col pb-16">
        {/* 전환 래퍼는 여기가 아니라 각 page.tsx에 있다 (PageTransition 주석 참고).
            탭바는 그 경계 밖이라 내용만 밀리고 탭바는 제자리에 남는다 */}
        {/* 사이트 신원(Organization·WebSite)은 모든 화면에 실린다 */}
        <JsonLd data={siteJsonLd()} />
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
