// 홈 — 수록 현황, 지역 타일, 교회 미리보기를 얹은 랜딩 화면

import { ArrowRight, BookOpen, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DataNotice } from "@/components/shared/DataNotice";
import {
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ChurchRow } from "@/features/churches/components/ChurchRow";
import { RegionTiles } from "@/features/churches/components/RegionTiles";
import {
  getAllChurches,
  getPreviewChurches,
} from "@/features/churches/data";
import { collectRegionCounts } from "@/features/churches/search";
import { SITE_NAME } from "@/lib/site";

/**
 * **`title`을 쓰지 않는다.** 여기서 선언하면 `layout.tsx`의 template이 걸려
 * `홈 · 개혁주의 교회 디렉토리`가 된다. 홈의 제목은 사이트명 그 자체여야 하므로
 * layout의 `default`를 그대로 상속받는다. canonical만 채우면 된다.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * 미리보기 교회를 15분마다 새로 뽑는다 (2026-09-12).
 *
 * **홈은 여전히 정적으로 서빙된다.** 요청마다 서버가 그리는 것이 아니라, 15분이
 * 지난 뒤 첫 요청에서 백그라운드로 다시 구워진다 — 사용자는 언제나 캐시된 HTML을
 * 받는다. **깜빡임도, 홈 탭을 누를 때마다의 서버 왕복도 없다.**
 *
 * ⚠️ **`force-dynamic`으로 바꾸지 말 것.** "새로고침마다 랜덤"이 되지만 **홈 탭을
 * 누를 때마다 서버 왕복이 생긴다.** 홈은 첫 번째 탭이자 하단 탭바의 기본 목적지라
 * 이 사이트에서 가장 자주 열리는 화면이다. `/churches`에서 `searchParams`를 거부한
 * 것과 **같은 이유**다(CLAUDE.md의 "상태 관리" 항목).
 *
 * ⚠️ **클라이언트에서 섞는 방식도 버렸다.** Static은 지키지만 하이드레이션 직후
 * 5줄이 통째로 바뀌는 깜빡임이 생긴다 — 정적 HTML의 5건을 보여준 뒤 다른 5건으로
 * 갈아끼우게 되기 때문이다.
 *
 * **이 프로젝트의 유일한 ISR 지점이다.** 나머지 라우트는 전부 순수 SSG다.
 * 데이터 갱신은 여전히 커밋으로만 한다 — 이건 데이터 신선도가 아니라 **표본 교체**다.
 */
export const revalidate = 900;

/** 홈 타일에 세울 지역 수. 나머지는 `그 외 지역` 한 칸으로 모은다 */
const TILE_REGIONS = 5;
/** 홈에서 미리 보여줄 교회 수 */
const PREVIEW_CHURCHES = 5;

export default function Home() {
  const churches = getAllChurches();
  const regions = collectRegionCounts(churches);
  // **뽑는 것은 무작위, 보여주는 것은 가나다.** 정렬까지 `getPreviewChurches`가 한다
  const preview = getPreviewChurches(PREVIEW_CHURCHES);

  const topRegions = regions.slice(0, TILE_REGIONS);
  const restCount =
    churches.length - topRegions.reduce((sum, { count }) => sum + count, 0);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8">
      {/*
        로고 락업 — eyebrow(`국내 개혁주의 교회`)를 대신한다 (2026-09-08).

        **상단 헤더가 없어 사이트명이 나올 자리가 여기뿐이다.** 그리고 공유 미리보기
        (OG 이미지)에는 같은 락업이 이미 있어서, 링크를 타고 들어온 사람이 화면에서
        같은 로고를 다시 보게 된다 — 그 어긋남을 없애는 것이 이 변경의 목적이다.

        **마크는 `/icon.png`다** — 파비콘·매니페스트·OG와 같은 파일이라 로고를 바꿀 때
        여전히 `icon.png` 하나만 갈아끼우면 된다. **쿼리 없는 경로를 쓴다**(Next가
        붙이는 해시는 빌드마다 달라진다).
      */}
      <div className="flex items-center gap-2.5">
        <Image
          src="/icon.png"
          alt=""
          width={32}
          height={32}
          priority
          className="rounded-lg"
        />
        <span className="flex flex-col">
          <span className="text-t5 font-semibold text-primary">{SITE_NAME}</span>
          {/*
            같은 이름의 영문 표기라 스크린리더가 연달아 두 번 읽지 않도록 감춘다.
            아래 롤링을 aria-hidden으로 감춘 것과 같은 이유다.
          */}
          <span
            aria-hidden
            className="text-t2 font-medium tracking-lockup text-muted-foreground"
          >
            REFORMED CHURCH DIRECTORY
          </span>
        </span>
      </div>

      {/*
        롤링은 장식이라 aria-hidden으로 감추고, 제목이 완결된 문장으로 읽히도록
        보이지 않는 대체 문구를 둔다. 스크린리더는 지역이 바뀔 때마다 읽지 않는다.
        globals.css의 키프레임이 6칸 고정이라 TILE_REGIONS와 짝이다.

        **락업이 eyebrow보다 무거워 제목까지 여백을 늘렸다**(mt-2 → mt-6).
      */}
      <h1 className="mt-6 text-t9 font-bold text-foreground">
        오늘,{" "}
        {/* `에서`는 굴러가지 않는다. 감추는 범위는 롤링 상자가 아니라 이 구절 전체다 */}
        <span aria-hidden>
          {/*
            롤링에만 브랜드 강세색을 준다. 락업이 상단을 무겁게 만들어 움직임이
            묻히는데, 청록이 그걸 되찾는다 — 색이 곧 "여기가 바뀐다"는 신호다.
          */}
          <span className="region-roll text-brand-accent">
            {topRegions.map(({ region }) => (
              <span key={region}>{region}</span>
            ))}
          </span>
          에서
        </span>
        {/* 롤링 대신 스크린리더가 읽을 원래 카피. 뒤 공백이 없으면 다음 줄과 붙어 읽힌다 */}
        <span className="sr-only">어디로 </span>
        <br />
        예배하러 가시나요?
      </h1>

      <div className="mt-6 rounded-lg bg-primary p-5 text-primary-foreground">
        <p className="text-t4 text-primary-foreground/70">수록 교회</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-t10 font-bold">{churches.length}</span>
          <span className="text-t5">
            곳 · {regions.length}개 지역
          </span>
        </p>
        <Link
          href="/churches"
          transitionTypes={NAV_FORWARD}
          className="mt-5 flex items-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-3 text-t4 text-primary-foreground/70 outline-none transition-colors hover:bg-primary-foreground/20 focus-visible:ring-3 focus-visible:ring-primary-foreground/40"
        >
          <Search aria-hidden className="size-4" />
          교회명·주소·담임목사 검색
        </Link>
      </div>

      {/*
        소개 화면 진입점 (2026-09-12에 실제 링크로 교체).

        **문구가 `이 사이트는 어떻게 만들어졌나요?`에서 바뀌었다.** `/about`이
        `개혁주의란`·`흘러온 길`·`용어 정리`까지 담게 되면서 옛 문구가 내용의
        앞 절반만 가리켰다. 지금 문구는 **용어를 모르는 신규 방문자**에게 말을
        거는 쪽이다 — 신뢰·출처 쪽 내용은 전 화면 푸터(`DataNotice`)가 이미 맡는다.

        **h1(`소개`)과 이름을 맞추지 않는다.** 이름 일치 규칙은 되돌아가기 줄에
        적용되는 것이고(2026-09-08), 홈에서 나가는 링크는 이미 설명형이다
        (`전체 보기`·`교회명·주소·담임목사 검색`). 이 링크도 같은 성격이다.

        ⚠️ **셰브런이 아니라 화살표다.** `AboutComingSoon`은 제자리에서 펼쳐지는
        조작이라 셰브런을 썼는데, 이제 **실제로 다른 화면으로 이동하므로** 같은
        아이콘을 두면 "여기서 펼쳐진다"는 잘못된 신호가 된다.

        **맨 텍스트 한 줄에서 면을 가진 카드로 올렸다 (2026-09-12).** 예전에는
        `muted` + `t4` + 배경 없음 + 가운데 정렬이었는데, 그 조합은 이 사이트에서
        `ChurchRow`의 메타 줄과 `DataNotice`의 면책 고지가 쓰는 어휘다 —
        **읽지 않아도 되는 것의 표기법으로 링크를 그린 셈**이라 바로 위 다크 카드
        옆에서 사라졌다. 탭 영역도 35px로 권장치(44px)에 못 미쳤다.

        **새 어휘를 만들지 않았다.** 표면은 `RegionTiles`의 `TILE`과 같고
        (`border` + `bg-card` + hover/active), 뼈대는 `ChurchRow`와 같다
        (원형 아이콘 + 2줄 + 오른쪽 아이콘). 홈에 이미 있는 것 둘을 합쳤을 뿐이다.

        **1군이 되지 않게 막았다.** `화면당 brand-solid 버튼은 하나`(ui-checklist
        원칙)를 위 다크 카드가 이미 썼으므로, 여기는 **밝은 테두리 면**에 머문다.
        위계가 `다크 채움 > 밝은 테두리 > 맨 텍스트` 3단으로 유지된다.

        **아이콘 타일에 `--brand-accent`를 쓴다 — 롤링 전용이던 역할을 넓힌 것이다.**
        홈에서 청록이 붙는 두 곳(제목의 지역 롤링, 이 진입점)은 **둘 다 처음 온
        사람에게 말을 거는 자리**라 색이 그 역할을 가리킨다. 네이비로 낮추려면
        `bg-primary/10 text-primary`로 바꾸면 된다(미선택 칩과 같은 어휘).

        **부제가 공간값을 한다.** `/about`은 역사·TULIP·표준문서·용어까지 6절인데
        제목 한 줄로는 안에 무엇이 있는지 한 글자도 드러나지 않았다.
      */}
      <Link
        href="/about"
        transitionTypes={NAV_FORWARD}
        className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px active:bg-muted"
      >
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-accent/10 text-brand-accent"
        >
          <BookOpen className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-t5 font-semibold text-foreground">
            개혁주의 교회를 찾기 전에
          </span>
          <span className="mt-1 block text-t4 text-muted-foreground">
            개혁주의란 무엇인지부터
          </span>
        </span>
        <ArrowRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
      </Link>

      <h2 className="mt-8 mb-3 text-t6 font-semibold text-foreground">
        지역으로 찾기
      </h2>
      <RegionTiles regions={topRegions} restCount={restCount} />

      <div className="mt-8 flex items-baseline justify-between border-t border-border pt-6">
        <h2 className="text-t6 font-semibold text-foreground">교회 둘러보기</h2>
        <Link
          href="/churches"
          transitionTypes={NAV_FORWARD}
          className="rounded-lg text-t4 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          전체 보기
        </Link>
      </div>
      <ul className="mt-1 divide-y divide-border">
        {preview.map((church) => (
          <li key={church.id}>
            <ChurchRow church={church} />
          </li>
        ))}
      </ul>

      {/* 목록이 있는 화면에만 붙인다. 짧은 화면에서는 임계값에 못 닿아 뜨지 않는다 */}
      <ScrollToTop />
      <DataNotice />

      {/* 고정 탭바가 마지막 줄을 가리지 않게 하는 여백. layout의 pb-16과 함께 작동한다 */}
      <div className="h-6" />
      </main>
    </PageTransition>
  );
}
