// 홈 — 수록 현황, 지역 타일, 교회 미리보기를 얹은 랜딩 화면

import { Search } from "lucide-react";
import Link from "next/link";
import {
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { ChurchRow } from "@/features/churches/components/ChurchRow";
import { RegionTiles } from "@/features/churches/components/RegionTiles";
import { getAllChurches } from "@/features/churches/data";
import { collectRegionCounts } from "@/features/churches/search";

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
      <p className="text-t4 text-muted-foreground">국내 개혁주의 교회</p>
      {/*
        롤링은 장식이라 aria-hidden으로 감추고, 제목이 완결된 문장으로 읽히도록
        보이지 않는 대체 문구를 둔다. 스크린리더는 지역이 바뀔 때마다 읽지 않는다.
        globals.css의 키프레임이 6칸 고정이라 TILE_REGIONS와 짝이다.
      */}
      <h1 className="mt-2 text-t9 font-bold text-foreground">
        오늘,{" "}
        {/* `에서`는 굴러가지 않는다. 감추는 범위는 롤링 상자가 아니라 이 구절 전체다 */}
        <span aria-hidden>
          <span className="region-roll">
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

      <p className="mt-8 border-t border-border py-6 text-t2 text-muted-foreground">
        교회 정보는 자체 수집 자료를 정리한 것입니다. 정보가 사실과 다르거나
        삭제를 원하시면{" "}
        <Link
          href="/report"
          transitionTypes={NAV_FORWARD}
          className="text-foreground underline underline-offset-2"
        >
          제보
        </Link>
        해 주세요.{" "}
        <Link
          href="/privacy"
          transitionTypes={NAV_FORWARD}
          className="text-foreground underline underline-offset-2"
        >
          개인정보 처리방침
        </Link>
      </p>
      </main>
    </PageTransition>
  );
}
