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

import { ChevronLeft, Info } from "lucide-react";
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

            {/*
              **선을 지우고 간격으로 나눈다 (2026-09-19).** 항목마다 `border-b`를 둬서
              여덟 줄이 그어져 있었다 — `RegionTiles`에서 **"선이 많으면 내용보다 격자가
              먼저 읽힌다"**며 테두리 열여섯을 걷어낸 기준이 여기엔 적용되지 않았다.
              칩 덩어리가 이미 항목 경계를 만들어서 선이 할 일이 없다.

              **간격이 `gap-8`(32px)이다.** 선을 지운 자리를 여백이 대신한다 —
              24px일 때는 항목 머리가 어디서 시작하는지 눈이 잡지 못했다.

              ⚠️ **총회마다 카드를 만들지 않는다.** 위 계열 5개와 같은 모양이 되는데
              **저쪽은 눌러서 랜딩으로 가는 카드이고 이쪽은 눌리지 않는다** — 같은
              모양에 다른 동작이 붙는다. 카드도 열세 장이 된다.
            */}
            <dl className="mt-4 flex flex-col gap-8">
              {ungrouped.synods.map((synod) => {
                const churches = all.filter(
                  (church) => church.denomination === synod.denomination,
                );
                if (!churches.length) return null;
                return (
                  <div key={synod.denomination}>
                    {/*
                      **오른쪽 건수를 없앴다.** 계열 카드는 랜딩으로 넘어가니 건수가
                      **"안 보이는 것의 요약"**이지만, 여기는 **교회 이름이 바로 아래
                      전부 나열된다.** 칩 개수가 곧 건수이고 최대 4개라 셀 수 있다 —
                      회색 숫자 여덟 개가 사라졌다.

                      **크기가 아니라 굵기로 세운다 — `t5 bold` (2026-09-19, 3차).**
                      선을 지운 뒤 총회명(t5 semibold)과 교회 칩(t4 medium)의 차이가
                      2px뿐이라 항목 머리로 읽히지 않았다. "교단명 앞에 아이콘을
                      넣자"는 요청이 나온 자리인데, **원인은 구분 표시가 없는 것이
                      아니라 제목이 약한 것**이었다.

                      ⚠️ **t6으로 올렸다가 되돌렸다.** 절 제목 `계열로 묶지 않은 교단`이
                      t6 bold인데 **그것은 위 계열 카드 5개와 형제**(허브의 여섯 번째
                      묶음)이고, 총회는 **그 안에 든 것**이다. 같은 급수를 주니 **부모와
                      자식이 같은 크기**가 됐다 — 굵기만으로는 그 층이 읽히지 않는다.

                      ⚠️ **부모를 올리는 쪽은 막혀 있다.** 절 제목만 t7로 올리면 형제인
                      계열 카드와 어긋나고, 카드까지 함께 올리면 **h1(t8, 22px)과 2px
                      차이**가 되어 이번에는 위쪽이 무너진다. 그래서 자식을 낮추고
                      **굵기를 semibold → bold로 한 단 올려 보상했다.**

                      결과는 세 단이다 — 절·계열 `t6 bold`(18) > 총회 `t5 bold`(16)
                      > 칩 `t4 medium`(14).

                      ⚠️ **아이콘을 붙이지 않는다.** 여덟이 같은 그림이면 구분이 아니라
                      반복이고, 총회마다 다른 그림을 줄 근거가 데이터에 없다(로고는
                      저작권이라 수집하지 않는다). 무엇보다 **아래 `Info`가 "안내"라는
                      뜻으로 이미 쓰이고 있어** 같은 화면에서 층위가 섞인다.
                    */}
                    <dt className="text-t5 font-bold text-foreground">
                      {synod.official || synod.denomination}
                    </dt>
                    <dd className="mt-1 text-t4 text-muted-foreground">
                      {synod.confession && <p>{synod.confession}</p>}
                      {synod.note && <p>{synod.note}</p>}
                      <div className="mt-2">
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
          <section className="mt-8 flex gap-2.5 rounded-lg border border-border p-4">
            {/*
              ⚠️ **`bg-muted` 덩어리를 쓰지 않는다 (2026-09-19).** `ChurchNotice`가 같은
              성격의 안내를 만들면서 **"회색 블록이 연달아 오면 '준비 중'으로 읽힌다"**며
              배경 대신 테두리와 `Info`를 골랐는데, 이 상자만 그 판단에서 벗어나 있었다.
              맞추고 나니 화면의 컨테이너 어휘가 **셋(카드·목록·회색상자)에서 둘로** 줄었다.

              **경고가 아니라 안내다** — `destructive`를 쓰지 않는 이유도 저쪽과 같다.
              확인하지 못한 것은 우리 데이터의 한계이지 그 교회의 결함이 아니다.
            */}
            <Info
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-t5 font-semibold text-foreground">
                교단을 확인하지 못한 교회 {noDenomination.length}곳
              </h2>
              <p className="mt-1 text-t4 text-muted-foreground">
                원본 자료에 교단 표기가 없어 어느 계열에도 넣지 않았습니다. 교단이
                없다는 뜻이 아니라 우리가 확인하지 못했다는 뜻입니다.
              </p>
              <div className="mt-2">
                <ChurchLinks churches={noDenomination} />
              </div>
            </div>
          </section>
        )}

        <DataNotice />
      </main>
    </PageTransition>
  );
}
