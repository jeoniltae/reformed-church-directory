import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* pb-16은 고정된 하단 탭바가 마지막 콘텐츠를 가리지 않게 하는 여백이다 */}
      <body className="min-h-full flex flex-col pb-16">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
