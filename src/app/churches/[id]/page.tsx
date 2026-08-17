// 교회 상세 — 89건 전량을 빌드 시점에 정적 생성한다 (SSG)

import {
  ChevronLeft,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NAV_BACK, PageTransition } from "@/components/shared/PageTransition";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAllChurchIds, getChurchById } from "@/features/churches/data";
import { churchJsonLd, toJsonLdScript } from "@/lib/json-ld";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";

export function generateStaticParams() {
  return getAllChurchIds().map((id) => ({ id }));
}

/** 교회명에 한글이 섞여 URL이 인코딩된 채 들어올 수 있다. `%`가 없으면 그대로 통과한다 */
function decodeId(raw: string): string {
  return raw.includes("%") ? decodeURIComponent(raw) : raw;
}

/**
 * 카카오맵 웹 링크. SDK도 앱 키도 필요 없어 지금 바로 쓸 수 있다.
 * 좌표가 없는 21건은 주소 검색으로 대체하므로 89건 전부 길찾기가 가능하다.
 */
function directionsUrl(church: Church): string {
  if (church.lat !== undefined && church.lng !== undefined) {
    const name = encodeURIComponent(church.name);
    return `https://map.kakao.com/link/to/${name},${church.lat},${church.lng}`;
  }
  return `https://map.kakao.com/link/search/${encodeURIComponent(church.address)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const church = getChurchById(decodeId((await params).id));
  if (!church) return {};

  const place = church.subRegion
    ? `${church.region} ${church.subRegion}`
    : church.region;
  return {
    title: church.name,
    description: `${place}에 있는 ${church.name} 정보입니다. 주소·담임목사·연락처를 확인하세요.`,
    alternates: { canonical: `/churches/${church.id}` },
  };
}

export default async function ChurchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const church = getChurchById(decodeId((await params).id));
  if (!church) notFound();

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-8">
        {/* 목록으로 돌아가는 이동이라 방향은 후퇴다 */}
        <Link
          href="/churches"
          transitionTypes={NAV_BACK}
          className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-t4 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft aria-hidden className="size-4" />
          목록으로
        </Link>

        {/*
          지도 자리. 실제 지도는 5단계(Kakao 지도 SDK 앱 키)에서 이 박스를 교체한다.
          좌표 유무로 구분하지 않는다 — 지금은 지도가 없어 68건과 21건이 똑같이 보인다.
        */}
        <div className="mt-3 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted">
          <MapPin aria-hidden className="size-6 text-muted-foreground" />
          <p className="text-t4 text-muted-foreground">지도 준비 중</p>
        </div>

        <div className="mt-5">
          {church.denomination && (
            <Badge variant="secondary">{church.denomination}</Badge>
          )}
          <h1 className="mt-2 text-t8 font-bold text-foreground">
            {church.name}
          </h1>
          {/* 지역은 따로 적지 않는다 — 한국 주소는 항상 시도로 시작해 그대로 중복이다 */}
          <p className="mt-1 text-t4 text-muted-foreground">{church.address}</p>
        </div>

        {/* 교단과 주소는 위 헤더에만 둔다. 여기 또 넣으면 같은 화면에 두 번 나온다 */}
        <section className="mt-6 border-t border-border pt-5">
          <h2 className="text-t4 font-semibold text-foreground">교회 정보</h2>
          <dl className="mt-3 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="shrink-0 text-t4 text-muted-foreground">
                담임목사
              </dt>
              <dd className="text-right text-t4 text-foreground">
                {church.pastor} 목사
              </dd>
            </div>
            {church.homepage && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-t4 text-muted-foreground">
                  홈페이지
                </dt>
                <dd className="text-t4">
                  <a
                    href={church.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg text-foreground underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    홈페이지 열기
                    <ExternalLink aria-hidden className="size-3.5" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/*
          전화 걸기가 이 화면의 유일한 brand-solid다.
          CLAUDE.md가 "탭 한 번으로 전화"를 핵심 동선으로 규정했다.
          Base UI Button은 네이티브 <button>을 전제하므로 링크에는 variant만 빌려 쓴다.
          phone이 없는 2건은 grid-cols-1로 떨어져 길찾기가 전체 너비를 쓴다.
        */}
        <div className={cn("mt-6 grid gap-2", church.phone && "grid-cols-2")}>
          <a
            href={directionsUrl(church)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full text-t4",
            )}
          >
            <Navigation aria-hidden />
            길찾기
          </a>
          {church.phone && (
            <a
              href={`tel:${church.phone}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full text-t4")}
            >
              <Phone aria-hidden />
              {church.phone}
            </a>
          )}
        </div>

        {/* 공개에 따르는 의무 — 출처를 밝히고 수정·삭제 요청 창구를 안내한다 */}
        <div className="mt-8 border-t border-border pt-5 text-t2 text-muted-foreground">
          <p>출처: {church.source}</p>
          <p className="mt-1">
            정보가 사실과 다르거나 삭제를 원하시면 알려주세요. 요청 창구는 준비
            중입니다.
          </p>
        </div>

        <script
          type="application/ld+json"
          // 검색엔진이 이 교회를 장소로 이해하게 한다. geo(좌표)가 여기 들어간다
          dangerouslySetInnerHTML={{
            __html: toJsonLdScript(churchJsonLd(church)),
          }}
        />
      </main>
    </PageTransition>
  );
}
