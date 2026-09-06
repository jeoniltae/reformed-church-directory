// 교단 랜딩 — `고신 교회 목록` 같은 탐색 쿼리를 받는 페이지
//
// 주소에는 묶음 이름이 아니라 slug를 쓴다 (`고신·고려 계열` → `/denomination/고신고려`).
// 매핑표와 `기타`를 제외하는 이유는 `features/churches/landing.ts`에 있다.
// 세그먼트를 ASCII로 두는 이유는 `app/region/[region]/page.tsx` 첫 주석에 있다.

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
import { ChurchCard } from "@/features/churches/components/ChurchCard";
import { getAllChurches } from "@/features/churches/data";
import {
  countBy,
  groupFromSlug,
  groupSummary,
  hasRegionLanding,
  landingGroups,
} from "@/features/churches/landing";
import { filterChurches } from "@/features/churches/search";
import { decodeRouteParam } from "@/lib/church-utils";
import { breadcrumbJsonLd, churchCollectionJsonLd } from "@/lib/json-ld";

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
  return {
    title: `${group} 교회`,
    description: `${group}에 속한 개혁주의 교회 ${churches.length}곳입니다. 지역·담임목사·주소·연락처를 확인하세요.`,
    alternates: { canonical: `/denomination/${slug}` },
  };
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
  // 이 교단이 있는 지역 중 랜딩이 있는 곳만 링크한다 — 임계값 미만 지역으로는 링크하지
  // 않는다. 링크를 걸면 크롤러가 얇은 페이지까지 따라가 임계값을 둔 의미가 없어진다
  const regionLinks = countBy(churches, "region")
    .map(({ value }) => value)
    .filter((region) => hasRegionLanding(all, region));

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

        <Link
          href="/churches"
          transitionTypes={NAV_BACK}
          className="rounded-lg text-t4 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          전체 교회 목록
        </Link>

        <h1 className="mt-2 text-t8 font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-t4 text-muted-foreground">{summary}</p>

        <ul className="mt-5 flex flex-col gap-2">
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
              {regionLinks.map((region) => (
                <li key={region}>
                  <Link
                    href={`/region/${region}`}
                    transitionTypes={NAV_FORWARD}
                    className="inline-block rounded-lg bg-muted px-3 py-1.5 text-t4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {region}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {otherGroups.length > 0 && (
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
            </ul>
          </nav>
        )}

        <DataNotice />
      </main>
    </PageTransition>
  );
}
