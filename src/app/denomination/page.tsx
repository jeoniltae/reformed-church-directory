// 교단 허브 — 어떤 교단들이 수록돼 있는지 한 화면에서 보여주고 랜딩으로 분배한다
//
// **이 페이지가 없으면 `기타` 묶음이 사이트 어디에도 글자로 나오지 않는다.** 랜딩을
// 만들지 않기로 한 묶음이라(`landing.ts`의 `EXCLUDED_GROUP`) 주소가 없고, 그래서
// `계신`·`한국개혁장로교회` 같은 총회명이 검색 가능한 텍스트로 한 번도 등장하지 않았다.
// 검색 이전에 **사람이 교단으로 찾을 방법이 없었다.**
//
// **`/churches`와 역할이 겹쳐 보이지 않게 한다.** 그쪽은 이름·주소로 찾는 곳이고
// 여기는 **어떤 교단이 있는지**를 보는 곳이다. `metadata.description`에서 갈라 준다.
//
// ⚠️ **OG 이미지를 새로 붙이지 않는다.** 루트의 기본 OG를 그대로 쓴다 —
// `churches/[id]/opengraph-image.tsx` 주석이 이유를 적어 뒀다: 랜딩류는 요청 시
// 렌더될 수 있는데 그 시점에 폰트 경로(`node_modules`)가 없을 수 있다.

import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  NAV_BACK,
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { DataNotice } from "@/components/shared/DataNotice";
import { JsonLd } from "@/components/shared/JsonLd";
import { SiteMark } from "@/components/shared/SiteMark";
import { ChurchLinks } from "@/app/denomination/ChurchLinks";
import { getAllChurches } from "@/features/churches/data";
import {
  groupContent,
  ungroupedContent,
} from "@/features/churches/denomination-content";
import {
  countBy,
  EXCLUDED_GROUP,
  facetLine,
  facetText,
  landingGroups,
} from "@/features/churches/landing";
import { breadcrumbJsonLd } from "@/lib/json-ld";
import { pageMetadata } from "@/lib/site";

const TITLE = "교단으로 찾기";

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  // `/churches`(이름·주소 검색)와 의도를 갈라 준다
  description:
    "수록된 개혁주의 교단을 계열별로 정리했습니다. 각 총회의 정식 표기와 채택한 신앙고백을 확인하세요.",
  path: "/denomination",
});

export default function DenominationHubPage() {
  const all = getAllChurches();
  const counts = new Map(
    countBy(all, "denominationGroup").map(({ value, count }) => [value, count]),
  );
  const groups = landingGroups()
    .map(({ group, slug }) => ({
      group,
      slug,
      count: counts.get(group) ?? 0,
      content: groupContent(group),
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);

  const ungrouped = ungroupedContent();
  const ungroupedCount = counts.get(EXCLUDED_GROUP) ?? 0;
  // 교단 표기가 아예 없는 건. `countBy`가 값 없는 건을 세지 않아 따로 구한다
  const noDenomination = all.filter((church) => !church.denomination);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "교회 찾기", path: "/churches" },
            { name: TITLE, path: "/denomination" },
          ])}
        />

        {/* 지역·교단 랜딩과 같은 구조다 — 판단 근거는 지역 랜딩 주석에 있다 */}
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

        <h1 className="mt-3 text-t8 font-bold text-foreground">{TITLE}</h1>
        {/*
          **여기는 라벨-값 블록으로 바꾸지 않았다.** 분포가 한 줄뿐이라 라벨 열을
          세우면 `교단` 한 단어를 위해 폭을 내주는 꼴이 된다. 다만 `순`은 두 랜딩과
          함께 걷어냈다 — 셋 중 하나에만 남으면 같은 값을 화면마다 다르게 말하게 된다.
        */}
        <p className="mt-2 text-t4 text-muted-foreground">
          <strong className="font-semibold text-foreground">
            {all.length}곳
          </strong>
          {" · "}
          {facetText(facetLine(countBy(all, "denominationGroup"), "종"))}
        </p>

        {/* ── 랜딩이 있는 계열 5개 ─────────────────────────────── */}
        <ul className="mt-6 flex flex-col gap-3">
          {groups.map(({ group, slug, count, content }) => (
            <li key={slug}>
              <Link
                href={`/denomination/${slug}`}
                transitionTypes={NAV_FORWARD}
                className="block rounded-lg border border-border p-4 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-t6 font-bold text-foreground">
                    {group}
                  </span>
                  <span className="shrink-0 text-t4 text-muted-foreground">
                    {count}곳
                  </span>
                </span>
                {content?.lead && (
                  <span className="mt-1 block text-t4 text-muted-foreground">
                    {content.lead}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/*
          ── 계열로 묶지 않은 교단 ───────────────────────────────
          **랜딩이 없으므로 교회 상세로 직접 링크한다.** 총회당 1~4곳이라 가능하고,
          이 링크가 곧 내부 링크 보강이 된다 — 그 교회들은 지금 `/churches`에서만 닿는다.
        */}
        {ungroupedCount > 0 && (
          <section className="mt-10 border-t border-border pt-6">
            <h2 className="flex items-baseline justify-between gap-3">
              <span className="text-t6 font-bold text-foreground">
                계열로 묶지 않은 교단
              </span>
              <span className="shrink-0 text-t4 text-muted-foreground">
                {ungroupedCount}곳
              </span>
            </h2>
            {ungrouped.lead && (
              <p className="mt-1 text-t4 text-muted-foreground">
                {ungrouped.lead}
              </p>
            )}

            <dl className="mt-4 flex flex-col gap-3">
              {ungrouped.synods.map((synod) => {
                const churches = all.filter(
                  (church) => church.denomination === synod.denomination,
                );
                if (!churches.length) return null;
                return (
                  <div
                    key={synod.denomination}
                    className="border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="flex items-baseline justify-between gap-3">
                      <span className="text-t5 font-semibold text-foreground">
                        {synod.official || synod.denomination}
                      </span>
                      <span className="shrink-0 text-t4 text-muted-foreground">
                        {churches.length}곳
                      </span>
                    </dt>
                    <dd className="mt-1 text-t4 text-muted-foreground">
                      {synod.confession && <p>{synod.confession}</p>}
                      {synod.note && <p>{synod.note}</p>}
                      <div className="mt-1">
                        <ChurchLinks churches={churches} />
                      </div>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        {/*
          **없는 것을 밝힌다.** 원본에 교단 표기가 없는 건이 있고, 그 사실을 감추면
          위 건수의 합이 총계와 맞지 않는 이유를 알 수 없다. `/about`의 `하지 않는 일`과
          `DataNotice`가 지켜온 원칙과 같다.
        */}
        {noDenomination.length > 0 && (
          <section className="mt-8 rounded-lg bg-muted p-4">
            <h2 className="text-t5 font-semibold text-foreground">
              교단을 확인하지 못한 교회 {noDenomination.length}곳
            </h2>
            <p className="mt-1 text-t4 text-muted-foreground">
              원본 자료에 교단 표기가 없어 어느 계열에도 넣지 않았습니다. 교단이
              없다는 뜻이 아니라 우리가 확인하지 못했다는 뜻입니다.
            </p>
            <div className="mt-2 text-t4">
              <ChurchLinks churches={noDenomination} />
            </div>
          </section>
        )}

        <DataNotice />
      </main>
    </PageTransition>
  );
}
