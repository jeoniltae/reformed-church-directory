import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { JsonLd } from "@/components/shared/JsonLd";
import { OfflineGuard } from "@/components/shared/OfflineGuard";
import { siteJsonLd } from "@/lib/json-ld";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  siteUrl,
  verificationMetadata,
} from "@/lib/site";
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
  // 구글·네이버·Bing 소유확인. 토큰이 비어 있으면 태그가 나가지 않는다 (`site.ts`)
  verification: verificationMetadata(),
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
        {/*
          오프라인에서 앱 내부 이동을 막는다. 안 막으면 RSC 페이로드 fetch가 실패하면서
          Next가 하드 내비게이션으로 폴백해 **크롬 오류 화면으로 문서가 교체되고,
          네트워크가 돌아와도 복구되지 않는다**(2026-09-11 실측). 링크가 16개 파일에
          흩어져 있어 여기 한 곳에서 캡처 단계로 잡는다 — 자세한 내용은 컴포넌트 주석.
        */}
        <OfflineGuard />
        {/*
          Vercel Web Analytics — 방문 수·페이지뷰만 익명으로 센다.

          **쿠키도 localStorage도 쓰지 않는다.** 그래서 동의 배너가 필요 없고,
          `/privacy`의 "쿠키를 쓰지 않는다"도 여전히 사실이다. 다만 **"분석 도구를
          쓰지 않는다"는 더 이상 사실이 아니므로 그 문구를 함께 고쳤다** —
          방침 문서와 실제 동작이 어긋나면 안 된다.

          프로덕션 배포에서만 데이터를 보낸다. 로컬에서는 아무것도 전송하지 않는다.
        */}
        <Analytics />
        {/*
          Vercel Speed Insights — 화면이 얼마나 빨리 열렸는지(Core Web Vitals)를 잰다.
          Analytics가 "몇 번 열렸나"라면 이쪽은 "얼마나 빨랐나"다.

          **쿠키도 localStorage도 쓰지 않는 것은 Analytics와 같다.** 그래서
          `/privacy`의 "쿠키를 사용하지 않습니다"는 여전히 사실이다. 다만 **재는 것이
          하나 늘었으므로 처리방침의 집계 항목에 성능 지표를 함께 적었다** —
          방침 문서와 실제 동작이 어긋나면 안 된다(위 Analytics 때와 같은 이유다).

          **이걸 붙인 이유** — `docs/seo-측정.md`가 "목록 화면 성능 89건 기준 전환
          137~149ms(CPU 4x 감속)"를 로컬 실측으로만 갖고 있다. 실제 방문자의 기기에서
          어떤지는 모른다. 고신 2,118건으로 늘릴 때 무엇이 느려지는지 판단하려면
          확장 전 기준선이 필요하다.

          프로덕션 배포에서만 데이터를 보낸다. 로컬에서는 아무것도 전송하지 않는다.
        */}
        <SpeedInsights />
      </body>
    </html>
  );
}
