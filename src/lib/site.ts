// 사이트 정체성 상수 — layout·manifest·OG 이미지가 같은 값을 보게 하는 단일 출처

import type { Metadata } from "next";

export const SITE_NAME = "개혁주의 교회 디렉토리";

export const SITE_DESCRIPTION =
  "국내 개혁주의 교단 교회를 교회명·지역·교단·담임목사 기준으로 찾아보세요.";

/**
 * 브랜드 네이비. `globals.css`의 `--primary`(`oklch(0.35 0.09 250)`)와 같은 색이다.
 *
 * **CSS 토큰을 두고 굳이 hex를 또 두는 이유** — OG 이미지(Satori)와 웹 매니페스트는
 * `oklch()`를 해석하지 못한다. 그 둘에서만 이 값을 쓴다. **색을 바꾸면 두 곳을 함께
 * 고쳐야 한다** — 화면은 토큰을 따라가지만 OG 이미지와 매니페스트는 여기를 따라간다.
 */
export const BRAND_NAVY = "#0b3c67";

/**
 * 공개 저장소. 제보 이슈와 데이터 이용 조건이 여기 있다.
 *
 * **`GITHUB_REPO` 환경변수와 별개다.** 그쪽은 서버가 Issues API를 부를 때 쓰는
 * 값이고 이건 화면·`llms.txt`에 노출하는 주소다.
 */
export const REPO_URL = "https://github.com/jeoniltae/reformed-church-directory";
export const DATA_LICENSE_URL = `${REPO_URL}/blob/main/data/LICENSE.md`;

/**
 * 문의용 별칭 주소.
 *
 * **개인 메일을 직접 싣지 않는다.** 공개 페이지의 평문 주소는 스팸 수집 봇이 긁어가고
 * 한 번 노출되면 되돌릴 수 없다. 도메인 별칭을 개인 메일로 포워딩해 두면 스팸이
 * 심해질 때 **별칭만 버리면 된다.**
 *
 * `/privacy`의 문의 절에서만 쓴다 — 모든 화면에 노출하면 수집 봇에 그만큼 더 걸린다.
 */
export const CONTACT_EMAIL = "contact@refchurch.kr";

/**
 * 검색엔진 소유확인 토큰.
 *
 * **비밀이 아니다.** HTML에 그대로 실리는 공개 값이라 저장소에 두는 것이 맞고,
 * 환경변수로 감쌀 이유가 없다. 발급 절차는 `docs/ui-checklist.md`의 6-5에 있다.
 *
 * **빈 값은 태그를 만들지 않는다** — 내용 없는 `<meta>`를 내보내면 검증이 실패한다.
 */
export const SEARCH_VERIFICATION = {
  /** Google Search Console — `google-site-verification` */
  google: "Ml6OE2KNBmj8WQESQfLc1QClPbHPJOFOL9Q_Uw4BAtU",
  /** 네이버 서치어드바이저 — `naver-site-verification` */
  naver: "de19774648d9ac3d20eac19da0eebe3f5f843ff1",
  /** Bing Webmaster Tools — `msvalidate.01`. **GSC에서 가져오기를 쓰면 필요 없다** */
  bing: "",
};

/**
 * 위 토큰을 Next의 `metadata.verification` 모양으로 바꾼다.
 * 값이 채워진 것만 넣고, 하나도 없으면 블록 자체를 만들지 않는다.
 */
export function verificationMetadata(): Metadata["verification"] | undefined {
  const { google, naver, bing } = SEARCH_VERIFICATION;

  // 네이버·Bing은 Next에 전용 키가 없어 `other`로 직접 이름을 적는다
  const other: Record<string, string> = {};
  if (naver) other["naver-site-verification"] = naver;
  if (bing) other["msvalidate.01"] = bing;

  const verification: Metadata["verification"] = {};
  if (google) verification.google = google;
  if (Object.keys(other).length) verification.other = other;

  return Object.keys(verification).length ? verification : undefined;
}

/**
 * canonical·OG·JSON-LD의 기준이 되는 절대 주소.
 *
 * **`NEXT_PUBLIC_SITE_URL` 하나만 보면 배포 직후 canonical이 전부
 * `http://localhost:3000/...`으로 나간다** — 89개 페이지가 그렇게 구워지는 것을
 * 클린 빌드로 확인했다. 도메인을 붙이기 전 프리뷰 단계에서도 값이 맞도록
 * Vercel이 빌드 시점에 넣어주는 주소를 중간 폴백으로 둔다.
 *
 * **끝에 슬래시를 붙이지 않는다.** `new URL(path, base)`와 문자열 이어붙이기가
 * 둘 다 이 전제를 깔고 있다.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export interface PageMeta {
  /** 화면 제목. `<title>`에는 template이 붙고 `og:title`에는 이 값만 나간다 */
  title: string;
  description: string;
  /** canonical이자 `og:url`. 앞에 `/`를 붙인 경로 */
  path: string;
  /**
   * 자기 OG 이미지를 가진 화면만 `true` — **지금은 교회 상세 하나뿐이다**
   * (`churches/[id]/opengraph-image.tsx`). 아래 `images` 설명을 볼 것.
   */
  ownImage?: boolean;
}

/**
 * 기본 OG 이미지 — 루트 `app/opengraph-image.tsx`가 굽는 그림이다.
 *
 * ⚠️ **규격은 `lib/og.ts`의 `OG_SIZE`와 같아야 한다.** 저쪽을 import하지 않는 것은
 * 그 파일이 `node:fs`(폰트 로딩)를 들고 있고 **이 파일은 화면 컴포넌트들이 함께
 * 읽는 자리**라서다. 대신 `site.test.ts`가 두 값이 같은지 고정한다.
 *
 * **쿼리 없는 경로를 쓴다.** 파일 규칙이 붙이는 해시(`?7f32f2b4…`)는 빌드마다
 * 달라진다 — 매니페스트 아이콘에서 같은 판단을 이미 했다.
 */
const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: SITE_NAME,
};

/**
 * 화면 하나의 메타데이터 한 벌 — 제목·설명·canonical·OG를 **한 값에서 만든다.**
 *
 * ⚠️ **`openGraph`를 주지 않으면 루트 값이 그대로 물려온다** (2026-09-19 실측).
 * `layout.tsx`가 `openGraph.title`·`description`·`url`을 들고 있어서, 페이지가
 * `title`만 선언하면 **공유 카드에는 사이트명과 홈 주소가 나갔다.**
 *
 * - **교회 상세는 OG 이미지에 교회명이 찍히는데 제목은 사이트명**이라 그림과 글이
 *   어긋났다. `언약교회` 카드가 `개혁주의 교회 디렉토리`라는 제목으로 공유됐다.
 * - ⚠️ **`og:url`이 전 페이지에서 `/`였다.** 카카오·페이스북은 이 값으로 공유 대상을
 *   식별하므로 **어느 교회를 공유해도 같은 대상으로 접힌다.** 좋아요·공유 수가
 *   홈으로 합쳐지고, 미리보기 캐시도 한 칸을 나눠 쓰게 된다.
 *
 * **canonical과 `og:url`을 같은 인자에서 만든다.** 둘이 갈라지면 어느 쪽이 맞는지
 * 크롤러가 판단해야 하는데, 그 판단을 시킬 이유가 없다.
 *
 * ⚠️ **`og:title`에는 사이트명을 붙이지 않는다**(`absolute`). `og:site_name`이 이미
 * 사이트명을 말하고 있어 `소개 · 개혁주의 교회 디렉토리`는 같은 말을 두 번 하는
 * 꼴이다. **브라우저 탭의 `<title>`은 template을 그대로 받는다** — 그쪽은 탭만 보고
 * 어느 사이트인지 알아야 하므로 접미사가 필요하다.
 *
 * **홈은 이 함수를 쓰지 않는다.** 루트 메타데이터가 이미 홈을 가리키고 있고,
 * `title`을 선언하면 template이 걸려 `홈 · 개혁주의 교회 디렉토리`가 된다.
 *
 * ## ⚠️ `images`를 직접 얹는 이유
 *
 * **페이지가 `openGraph`를 선언하면 루트에서 물려받던 `images`까지 통째로 사라진다.**
 * Next는 `openGraph` 객체를 통으로 갈아끼우기 때문이다. 이 함수를 처음 넣었을 때
 * **랜딩·정적 화면 19개의 `og:image`가 실제로 사라졌다**(빌드 산출물로 확인).
 * 공유 카드에서 그림이 빠지면 클릭률이 떨어지는데 **빌드도 lint도 통과한다.**
 *
 * **자기 이미지를 가진 화면은 `ownImage`로 비켜선다.** 교회 상세는 자기 세그먼트에
 * `opengraph-image.tsx`가 있어 그쪽이 여전히 적용된다 — 여기서 기본 이미지를 얹으면
 * 교회별 그림을 덮어쓴다.
 */
export function pageMetadata({
  title,
  description,
  path,
  ownImage,
}: PageMeta): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: { absolute: title },
      description,
      url: path,
      ...(ownImage ? {} : { images: [DEFAULT_OG_IMAGE] }),
    },
  };
}

/**
 * 데이터 라이선스의 CC 공식 안내(deed).
 *
 * **`DATA_LICENSE_URL`과 가리키는 것이 다르다.** 그쪽은 **우리 조건 전문**이고
 * (CC BY-NC에 **삭제 요청 승계**라는 추가 조건이 붙어 있다), 이쪽은 **CC 원문**이다.
 * `/privacy`의 배지가 이 주소로 나가고, `rel="license"`는 **우리 조건 쪽에만** 단다 —
 * 두 주소에 모두 달면 어느 것이 이 사이트의 라이선스인지 신호가 갈린다.
 */
export const CC_DEED_URL =
  "https://creativecommons.org/licenses/by-nc/4.0/deed.ko";
