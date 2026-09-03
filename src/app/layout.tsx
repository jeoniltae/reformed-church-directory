import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
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

/**
 * canonical·OG의 기준이 되는 절대 주소.
 *
 * **`NEXT_PUBLIC_SITE_URL` 하나만 보면 배포 직후 canonical이 전부
 * `http://localhost:3000/...`으로 나간다** — 89개 페이지가 그렇게 구워지는 것을
 * 클린 빌드로 확인했다. 도메인을 붙이기 전 프리뷰 단계에서도 값이 맞도록
 * Vercel이 빌드 시점에 넣어주는 주소를 중간 폴백으로 둔다.
 */
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "개혁주의 교회 디렉토리",
    template: "%s · 개혁주의 교회 디렉토리",
  },
  description:
    "국내 개혁주의 교단 교회를 교회명·지역·교단·담임목사 기준으로 찾아보세요.",
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
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
