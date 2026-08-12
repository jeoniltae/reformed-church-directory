import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버는 localhost 외의 출처에서 오는 dev 자산 요청을 기본으로 차단한다.
  // 폰으로 LAN IP에 붙으면 HTML은 200인데 JS 청크가 403이라 하이드레이션이 통째로 죽는다
  // (화면은 보이는데 필터·전환이 안 먹는 증상). 개발 모드에만 적용되는 설정이다.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    // React의 <ViewTransition>을 라우트 전환에 연결한다 (탭 슬라이드용).
    // 플래그만으로는 화면이 달라지지 않고, 미지원 브라우저에서는 전환 없이 동작한다.
    viewTransition: true,
  },
};

export default nextConfig;
