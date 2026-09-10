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

  /**
   * 교회 id가 바뀌어 못 쓰게 된 옛 상세 URL을 새 주소로 넘긴다.
   *
   * **id는 교회명 + 시군구에서 나오므로 교회가 이전하거나 개명하면 URL이 바뀐다.**
   * 사이트 공개(2026-09-06) 전에 바뀐 건(우리개혁교회→서울개혁교회 등 3건)은
   * 색인된 적이 없어 여기 넣지 않는다. 공개 이후에 바뀐 것만 대상이다.
   *
   * 늘어나면 `data/`의 매핑 파일로 옮긴다. 지금은 한 건이라 그대로 적어 둔다.
   *
   * ⚠️ **`source`는 반드시 퍼센트 인코딩해야 한다. 한글 원문을 쓰면 조용히 안 먹는다.**
   * Next는 `source`를 정규식으로 굳혀(`.next/routes-manifest.json`) 들어온 경로와
   * 대조하는데, 그 경로는 브라우저·크롤러가 보낸 인코딩된 형태 그대로다.
   * 한글로 적으면 정규식도 한글이 되어 절대 일치하지 않는다 —
   * 에러 없이 404가 뜰 뿐이라 실측(`next start` + curl)으로만 드러난다.
   * `destination`은 인코딩하지 않아도 되지만 canonical과 표기를 맞추려고 함께 인코딩한다.
   * 값은 `encodeURI("/churches/언약교회-강동구")`로 만든다.
   */
  async redirects() {
    return [
      {
        // /churches/언약교회-강동구 → /churches/언약교회-하남시
        // 서울 강동구 강일동 → 경기 하남시 하산곡동 이전 (2026-09-07 확인).
        // 경위는 data/address-fixes.json의 `언약교회-강동구` 행 참조.
        source: "/churches/%EC%96%B8%EC%95%BD%EA%B5%90%ED%9A%8C-%EA%B0%95%EB%8F%99%EA%B5%AC",
        destination: "/churches/%EC%96%B8%EC%95%BD%EA%B5%90%ED%9A%8C-%ED%95%98%EB%82%A8%EC%8B%9C",
        permanent: true, // 308 — 검색엔진에 색인 주소를 교체하라고 알린다
      },
      {
        // /churches/바로선개혁교회-성북구 → /churches/바로선개혁교회-은평구
        // 서울 성북구 정릉동 → 서울 은평구 진관동 이전 (2026-09-10 확인).
        // 경위는 data/address-fixes.json의 `바로선개혁교회-성북구` 행 참조.
        source: "/churches/%EB%B0%94%EB%A1%9C%EC%84%A0%EA%B0%9C%ED%98%81%EA%B5%90%ED%9A%8C-%EC%84%B1%EB%B6%81%EA%B5%AC",
        destination: "/churches/%EB%B0%94%EB%A1%9C%EC%84%A0%EA%B0%9C%ED%98%81%EA%B5%90%ED%9A%8C-%EC%9D%80%ED%8F%89%EA%B5%AC",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
