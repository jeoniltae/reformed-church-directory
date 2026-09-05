// 지역 랜딩 — `서울 개혁주의 교회` 같은 탐색 쿼리를 받는 페이지
//
// **`/churches`의 지역 칩과 역할이 다르다.** 칩은 클릭으로만 동작해 고유 URL이 없어
// 검색엔진에 잡히지 않는다. 이 페이지는 지역마다 주소가 있어 색인 대상이 된다.
// 칩 필터는 그대로 두고 이 라우트를 새로 얹은 것이다 (CLAUDE.md "상태 관리" 결정 유지).
//
// **세그먼트가 `지역`이 아니라 `region`인 이유** — 폴더명을 한글로 두면 빌드가
// `InvalidCharacterError`로 죽는다(2026-09-05 실측). Next의 세그먼트 캐시가 경로를
// base64로 인코딩하는데 `btoa`는 Latin-1만 받는다. **한글 파라미터 값은 멀쩡하다**
// (`/churches/언약교회-강동구`가 이미 그렇게 동작한다). 그래서 정적 세그먼트만
// ASCII로 두고 검색에 실제로 쓰이는 지역명은 주소에 한글 그대로 남겼다.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NAV_BACK,
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { JsonLd } from "@/components/shared/JsonLd";
import { ChurchCard } from "@/features/churches/components/ChurchCard";
import { getAllChurches } from "@/features/churches/data";
import {
  countBy,
  landingRegions,
  regionSummary,
  slugFromGroup,
} from "@/features/churches/landing";
import { filterChurches } from "@/features/churches/search";
import { decodeRouteParam } from "@/lib/church-utils";
import { breadcrumbJsonLd, churchCollectionJsonLd } from "@/lib/json-ld";

/**
 * 임계값을 채운 지역만 미리 굽는다.
 *
 * **미달 지역을 여기서 빼도 그 주소가 404가 되지는 않는다.** `dynamicParams` 기본값이
 * 켜져 있어 요청이 오면 그때 렌더된다. 미리 굽지 않고 sitemap에 넣지 않을 뿐이라,
 * 건수가 오르내려도 이미 색인된 주소가 깨지지 않는다.
 */
export function generateStaticParams() {
  return landingRegions(getAllChurches()).map((region) => ({ region }));
}

function churchesIn(region: string) {
  return filterChurches(getAllChurches(), { region });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ region: string }>;
}): Promise<Metadata> {
  const region = decodeRouteParam((await params).region);
  const churches = churchesIn(region);
  if (!churches.length) return {};

  return {
    title: `${region} 개혁주의 교회`,
    description: `${region}에 있는 개혁주의 교회 ${churches.length}곳입니다. 교단·담임목사·주소·연락처를 확인하세요.`,
    alternates: { canonical: `/region/${region}` },
  };
}

export default async function RegionLandingPage({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  const region = decodeRouteParam((await params).region);
  const churches = churchesIn(region);
  // 데이터에 없는 지역이다. 임계값 미달과는 다르다 — 그쪽은 건수가 1이라도 렌더된다
  if (!churches.length) notFound();

  const all = getAllChurches();
  const otherRegions = landingRegions(all).filter((r) => r !== region);
  // 이 지역에 실제로 있는 교단만 링크한다. 랜딩이 없는 묶음(`기타`)은 slug가 없어 빠진다
  const groupLinks = countBy(churches, "denominationGroup").flatMap(
    ({ value }) => {
      const slug = slugFromGroup(value);
      return slug ? [{ label: value, slug }] : [];
    },
  );

  const title = `${region} 개혁주의 교회`;
  const summary = regionSummary(region, churches);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        <JsonLd
          data={churchCollectionJsonLd({
            name: title,
            description: summary,
            path: `/region/${region}`,
            churches,
          })}
        />
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "교회 찾기", path: "/churches" },
            { name: title, path: `/region/${region}` },
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
        {/* 목록만 있으면 얇다. 교단 구성을 문장으로 덧붙여 무엇을 모아둔 곳인지 밝힌다 */}
        <p className="mt-1 text-t4 text-muted-foreground">{summary}</p>

        <ul className="mt-5 flex flex-col gap-2">
          {churches.map((church) => (
            <li key={church.id}>
              <ChurchCard church={church} />
            </li>
          ))}
        </ul>

        {/*
          랜딩끼리 이어 크롤러가 한 페이지에서 다음 페이지로 넘어갈 길을 만든다.
          이 링크가 없으면 각 랜딩이 홈에서만 닿는 막다른 길이 된다.
        */}
        {groupLinks.length > 0 && (
          <nav className="mt-8 border-t border-border pt-5">
            <h2 className="text-t4 font-semibold text-foreground">
              교단으로 찾기
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {groupLinks.map(({ label, slug }) => (
                <li key={slug}>
                  <Link
                    href={`/denomination/${slug}`}
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

        {otherRegions.length > 0 && (
          <nav className="mt-6">
            <h2 className="text-t4 font-semibold text-foreground">다른 지역</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {otherRegions.map((other) => (
                <li key={other}>
                  <Link
                    href={`/region/${other}`}
                    transitionTypes={NAV_FORWARD}
                    className="inline-block rounded-lg bg-muted px-3 py-1.5 text-t4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {other}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </main>
    </PageTransition>
  );
}
