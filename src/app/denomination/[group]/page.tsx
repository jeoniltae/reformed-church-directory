// 교단 랜딩 — `고신 교회 목록` 같은 탐색 쿼리를 받는 페이지
//
// 주소에는 묶음 이름이 아니라 slug를 쓴다 (`고신·고려 계열` → `/denomination/고신고려`).
// 매핑표와 `기타`를 제외하는 이유는 `features/churches/landing.ts`에 있다.
// 세그먼트를 ASCII로 두는 이유는 `app/region/[region]/page.tsx` 첫 주석에 있다.

import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NAV_BACK,
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { DataNotice } from "@/components/shared/DataNotice";
import { JsonLd } from "@/components/shared/JsonLd";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { SiteMark } from "@/components/shared/SiteMark";
import { ChurchCard } from "@/features/churches/components/ChurchCard";
import { LandingFacts } from "@/features/churches/components/LandingFacts";
import { getAllChurches } from "@/features/churches/data";
import { groupContent } from "@/features/churches/denomination-content";
import {
  countBy,
  facetLine,
  groupFromSlug,
  groupSummary,
  hasRegionLanding,
  landingGroups,
} from "@/features/churches/landing";
import { filterChurches } from "@/features/churches/search";
import { decodeRouteParam } from "@/lib/church-utils";
import { breadcrumbJsonLd, churchCollectionJsonLd } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return landingGroups().map(({ slug }) => ({ group: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ group: string }>;
}): Promise<Metadata> {
  const slug = decodeRouteParam((await params).group);
  const group = groupFromSlug(slug);
  if (!group) return {};

  const churches = filterChurches(getAllChurches(), {
    denominationGroup: group,
  });
  const count = `${group}에 속한 개혁주의 교회 ${churches.length}곳입니다.`;
  /*
    **리드 첫 문장을 앞에 세운다.** 기존 정형문(`…N곳입니다. 지역·담임목사·주소·
    연락처를 확인하세요.`)은 다섯 랜딩이 건수만 다른 같은 문장이라 검색결과에서
    서로 구분되지 않았다. 리드는 계열마다 내용이 달라 그 구분을 만든다.
  */
  /*
    ⚠️ **끝의 마침표를 떼고 다시 붙인다.** `split(". ")`는 **리드가 한 문장이면
    자를 곳이 없어 마침표를 단 채 통째로** 돌아오고, 아래 템플릿이 거기에 `.`를
    한 번 더 붙여 `묶었습니다.. 대신 계열에…`가 됐다(대신·독립·해외 2건 실측).
    **검색결과 스니펫에 그대로 나가는 자리라 눈에 띈다.**
  */
  const lead = groupContent(group)
    ?.lead.split(". ")[0]
    .replace(/[.]$/, "");
  return pageMetadata({
    title: `${group} 교회`,
    description: lead ? `${lead}. ${count}` : `${count} 지역·담임목사·주소·연락처를 확인하세요.`,
    path: `/denomination/${slug}`,
  });
}

export default async function GroupLandingPage({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const slug = decodeRouteParam((await params).group);
  const group = groupFromSlug(slug);
  // 표에 없는 slug다. 랜딩을 만들지 않기로 한 `기타`도 여기로 떨어진다
  if (!group) notFound();

  const all = getAllChurches();
  const churches = filterChurches(all, { denominationGroup: group });
  if (!churches.length) notFound();

  const otherGroups = landingGroups().filter((g) => g.slug !== slug);
  // 상단 요약과 아래 지역 링크가 같은 집계를 쓴다 — 두 곳이 다른 숫자를 말하면 안 된다
  const regionCounts = countBy(churches, "region");
  /*
    **지역을 하나도 빼지 않고 보여준다.** 위 요약은 상위 3개뿐이라 이 줄이 이 계열의
    지역 분포를 끝까지 말하는 유일한 곳이다.

    ⚠️ **임계값 미만 지역은 랜딩이 아니라 칩 필터로 보낸다.** 얇은 랜딩으로 링크를
    걸면 크롤러가 따라가 `LANDING_MIN`을 둔 의미가 없어진다. 홈의 `RegionTiles`가
    같은 문제를 같은 방식으로 풀었다 — 갈 곳은 주되 색인 대상은 늘리지 않는다.
  */
  const regionLinks = regionCounts.map(({ value, count }) => ({
    region: value,
    count,
    href: hasRegionLanding(all, value)
      ? `/region/${value}`
      : `/churches?region=${encodeURIComponent(value)}`,
  }));

  // 총회별 건수. 원고의 순서가 아니라 실제 건수 순으로 세운다
  const synodCounts = new Map(
    countBy(churches, "denomination").map(({ value, count }) => [value, count]),
  );
  const content = groupContent(group);
  const synods = (content?.synods ?? [])
    .map((synod) => ({ ...synod, count: synodCounts.get(synod.denomination) ?? 0 }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);

  const title = `${group} 교회`;
  const summary = groupSummary(group, churches);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        <JsonLd
          data={churchCollectionJsonLd({
            name: title,
            description: summary,
            path: `/denomination/${slug}`,
            churches,
          })}
        />
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "교회 찾기", path: "/churches" },
            { name: title, path: `/denomination/${slug}` },
          ])}
        />

        {/* 지역 랜딩과 같은 구조다 — 그쪽 주석에 판단 근거를 적어 뒀다 */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/churches"
            transitionTypes={NAV_BACK}
            className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-t4 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeft aria-hidden className="size-4" />
            교회 찾기
          </Link>
          <SiteMark />
        </div>

        <h1 className="mt-3 text-t8 font-bold text-foreground">{title}</h1>
        {/*
          h1이 이미 교단명을 말했으므로 되풀이하지 않는다. `summary`를 JSON-LD용으로
          남겨두는 이유와 라벨-값 블록으로 바꾼 경위는 지역 랜딩 주석 참고 —
          **두 랜딩이 같은 블록을 쓴다.** 한쪽만 `순`이 남으면 같은 성격의 두 화면이
          서로 다른 말을 하게 된다.
        */}
        <LandingFacts
          count={churches.length}
          facts={[{ label: "지역", value: facetLine(regionCounts, "개") }]}
        />

        {content?.lead && (
          <p className="mt-3 text-t5 text-foreground">{content.lead}</p>
        )}

        {/*
          **이 계열에 어떤 총회가 있는지 이름으로 밝힌다.** 그전에는 정식 표기가
          사이트 어디에도 없어 `대한예수교장로회(고신)` 같은 쿼리를 받을 텍스트가
          없었다. 새 디자인 어휘를 만들지 않고 `/about`의 용어 정리와 같은
          `<dl>` + `border-b` 구조를 쓴다.
        */}
        {synods.length > 0 && (
          <section className="mt-6 border-t border-border pt-5">
            <h2 className="text-t4 font-semibold text-foreground">
              이 계열의 총회
            </h2>
            <dl className="mt-3 flex flex-col gap-3">
              {synods.map((synod) => (
                <div
                  key={synod.denomination}
                  className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                >
                  <dt className="text-t5 font-semibold text-foreground">
                    {synod.official || synod.denomination}
                  </dt>
                  {/* 건수를 dd에 둔다 — 신앙고백·비고가 없는 총회에서도 dd가 비지 않는다 */}
                  <dd className="mt-1 text-t4 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {synod.count}곳
                    </span>
                    {synod.confession && (
                      <span className="mt-1 block">{synod.confession}</span>
                    )}
                    {synod.note && <span className="mt-1 block">{synod.note}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            {/*
              **빈칸을 침묵으로 두지 않는다.** 신앙고백이 없는 행이 섞여 있는데
              아무 말이 없으면 그 총회가 신조를 안 가진 것처럼 읽힌다. 한 줄로
              한꺼번에 밝혀 행마다 같은 말을 되풀이하지 않는다.

              ⚠️ **`text-t3`이었는데 그런 단계가 없다** (2026-09-18 발견). `@theme`에도
              `utils.ts` 등록 목록에도 없어서 **Tailwind가 클래스를 아예 만들지 않았고**,
              이 문단만 브라우저 기본값(16px)으로 나가 **위 총회 행(t4)보다 커져 있었다.**
              작게 쓰려던 안내가 그 절에서 가장 큰 글씨였던 셈이다.

              **t2가 아니라 t4로 내린다.** t2는 전 화면 푸터(`DataNotice`)의 면책 고지가
              쓰는 아래 층이고, 이 절이 본뜬 `/about`의 용어 정리는 **t4가 바닥**이다
              (2026-09-12에 그쪽 작은 글씨를 한 단계씩 올린 판단).

              ⚠️ **단계가 없는 `text-t*`는 조용히 사라진다** — 빌드도 lint도 통과한다.
              새 단계가 필요하면 `globals.css`의 `@theme`과 `src/lib/utils.ts`에 **함께**
              등록해야 한다(CLAUDE.md "코드 컨벤션").
            */}
            <p className="mt-3 text-t4 text-muted-foreground">
              신앙고백은 총회가 공식 자료로 밝힌 것만 적었습니다. 비어 있는 것은
              채택한 신조가 없다는 뜻이 아니라 우리가 확인하지 못했다는 뜻입니다.
            </p>
          </section>
        )}

        <ul className="mt-6 flex flex-col gap-2">
          {churches.map((church) => (
            <li key={church.id}>
              <ChurchCard church={church} />
            </li>
          ))}
        </ul>

        {regionLinks.length > 0 && (
          <nav className="mt-8 border-t border-border pt-5">
            <h2 className="text-t4 font-semibold text-foreground">
              지역으로 찾기
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {regionLinks.map(({ region, count, href }) => (
                <li key={region}>
                  <Link
                    href={href}
                    transitionTypes={NAV_FORWARD}
                    className="inline-block rounded-lg bg-muted px-3 py-1.5 text-t4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {region} <span className="text-foreground">{count}곳</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/*
          **허브 칩을 줄 끝에 둔다 (2026-09-18).** 그전에는 계열 5개가 서로만
          가리키는 닫힌 고리였다 — 여기서 `기타` 묶음으로는 갈 방법이 없었고,
          허브로 들어오는 링크는 사이트 전체에서 지역 랜딩의 `기타` 칩 하나뿐이었다.

          **`기타` 칩을 여기 두지 않는다.** 랜딩이 없어 주소가 없기도 하지만,
          그보다 이 줄은 **계열 이름이 늘어선 자리**라 거기에 `기타`를 끼우면
          "기타 계열"이라는 교단이 있는 것처럼 읽힌다 — `llms.txt`가 `기타`를
          맨 뒤로 빼고 괄호로 설명한 것과 같은 이유다. 허브가 그 설명을 맡는다.
        */}
        <nav className="mt-6">
          <h2 className="text-t4 font-semibold text-foreground">다른 교단</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {otherGroups.map(({ group: label, slug: otherSlug }) => (
              <li key={otherSlug}>
                <Link
                  href={`/denomination/${otherSlug}`}
                  transitionTypes={NAV_FORWARD}
                  className="inline-block rounded-lg bg-muted px-3 py-1.5 text-t4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/denomination"
                transitionTypes={NAV_FORWARD}
                className="inline-block rounded-lg bg-muted px-3 py-1.5 text-t4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                전체 보기
              </Link>
            </li>
          </ul>
        </nav>

        {/* 목록이 있는 화면에만 붙인다. 짧은 화면에서는 임계값에 못 닿아 뜨지 않는다 */}
        <ScrollToTop />
        <DataNotice />
      </main>
    </PageTransition>
  );
}
