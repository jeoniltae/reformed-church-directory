import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // React의 <ViewTransition>을 라우트 전환에 연결한다 (탭 슬라이드용).
    // 플래그만으로는 화면이 달라지지 않고, 미지원 브라우저에서는 전환 없이 동작한다.
    viewTransition: true,
  },
};

export default nextConfig;
