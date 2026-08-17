// 교회 상세 — 89건 전량을 빌드 시점에 정적 생성한다 (SSG)

import { ChevronLeft, ExternalLink, MapPin, Phone, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NAV_BACK, PageTransition } from "@/components/shared/PageTransition";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAllChurchIds, getChurchById } from "@/features/churches/data";
import { churchJsonLd, toJsonLdScript } from "@/lib/json-ld";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return getAllChurchIds().map((id) => ({ id }));
}

/** 교회명에 한글이 섞여 URL이 인코딩된 채 들어올 수 있다. `%`가 없으면 그대로 통과한다 */
function decodeId(raw: string): string {
  return raw.includes("%") ? decodeURIComponent(raw) : raw;
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

        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="text-t8 font-bold text-foreground">{church.name}</h1>
          {church.denomination && (
            <Badge variant="secondary" className="mt-1 shrink-0">
              {church.denomination}
            </Badge>
          )}
        </div>

        <dl className="mt-5 flex flex-col gap-3">
          <div className="flex gap-2">
            <dt className="sr-only">주소</dt>
            <MapPin
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            {/* 지역은 따로 적지 않는다 — 한국 주소는 항상 시도로 시작해 그대로 중복이다 */}
            <dd className="text-t5 text-foreground">{church.address}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="sr-only">담임목사</dt>
            <User
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            />
            <dd className="text-t5 text-foreground">{church.pastor} 목사</dd>
          </div>
        </dl>

        {/*
          전화 걸기가 이 화면의 유일한 brand-solid다.
          CLAUDE.md가 "탭 한 번으로 전화"를 핵심 동선으로 규정했다.
          Base UI Button은 네이티브 <button>을 전제하므로 링크에는 variant만 빌려 쓴다.
        */}
        <div className="mt-6 flex flex-col gap-2">
          {church.phone && (
            <a
              href={`tel:${church.phone}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full text-t5")}
            >
              <Phone aria-hidden />
              {church.phone}
            </a>
          )}
          {church.homepage && (
            <a
              href={church.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full text-t5",
              )}
            >
              <ExternalLink aria-hidden />
              홈페이지 열기
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
