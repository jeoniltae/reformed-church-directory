// 홈 — 수록 현황, 지역 타일, 교회 미리보기를 얹은 랜딩 화면

import { Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AboutComingSoon } from "@/components/shared/AboutComingSoon";
import { DataNotice } from "@/components/shared/DataNotice";
import {
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ChurchRow } from "@/features/churches/components/ChurchRow";
import { RegionTiles } from "@/features/churches/components/RegionTiles";
import { getAllChurches } from "@/features/churches/data";
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

/** 홈 타일에 세울 지역 수. 나머지는 `그 외 지역` 한 칸으로 모은다 */
const TILE_REGIONS = 5;
/** 홈에서 미리 보여줄 교회 수 */
const PREVIEW_CHURCHES = 5;

export default function Home() {
  const churches = getAllChurches();
  const regions = collectRegionCounts(churches);

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
        소개 화면 진입점 — 지금은 목적지가 없어 누르면 제자리에서 안내가 펼쳐진다.
        `/about`이 생기면 `AboutComingSoon`을 지우고 실제 링크로 바꾼다.
      */}
      <AboutComingSoon />

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
        {churches.slice(0, PREVIEW_CHURCHES).map((church) => (
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
