// 교회 상세 — 89건 전량을 빌드 시점에 정적 생성한다 (SSG)

import { ChevronLeft, ExternalLink, Navigation, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataNotice } from "@/components/shared/DataNotice";
import { JsonLd } from "@/components/shared/JsonLd";
import { NAV_BACK, PageTransition } from "@/components/shared/PageTransition";
import { SiteMark } from "@/components/shared/SiteMark";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ChurchMap } from "@/features/churches/components/ChurchMap";
import { ChurchNotice } from "@/features/churches/components/ChurchNotice";
import { ChurchRow } from "@/features/churches/components/ChurchRow";
import {
  getAllChurchIds,
  getAllChurches,
  getChurchById,
} from "@/features/churches/data";
import {
  hasRegionLanding,
  slugFromGroup,
} from "@/features/churches/landing";
import { hasCoords } from "@/features/churches/map/points";
import {
  NEARBY_RADIUS_KM,
  nearbyChurches,
} from "@/features/churches/nearby";
import { decodeRouteParam } from "@/lib/church-utils";
import { breadcrumbJsonLd, churchJsonLd } from "@/lib/json-ld";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";
import { pageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return getAllChurchIds().map((id) => ({ id }));
}

/**
 * 카카오맵 웹 링크. SDK도 앱 키도 필요 없어 지금 바로 쓸 수 있다.
 * 좌표가 없는 1건은 주소 검색으로 대체하므로 89건 전부 길찾기가 가능하다.
 * **그 1건은 주소 자체가 불완전하다** — 그래서 `notice`가 미리 알린다.
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
  const church = getChurchById(decodeRouteParam((await params).id));
  if (!church) return {};

  const place = church.subRegion
    ? `${church.region} ${church.subRegion}`
    : church.region;
  return pageMetadata({
    title: church.name,
    description: `${place}에 있는 ${church.name} 정보입니다. 주소·담임목사·연락처를 확인하세요.`,
    path: `/churches/${church.id}`,
    // 교회별 OG 이미지가 같은 세그먼트에 있다 — 기본 이미지를 얹으면 그것을 덮어쓴다
    ownImage: true,
  });
}

export default async function ChurchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const church = getChurchById(decodeRouteParam((await params).id));
  if (!church) notFound();

  // 이 교회가 속한 랜딩으로 가는 역링크. 크롤러에게는 상세 89개가 지역·교단으로 묶이는
  // 구조를 알리는 신호이고, 사람에게는 "같은 지역 다른 교회"로 넘어가는 길이다.
  // **랜딩이 있는 것만 건다** — 임계값 미만 지역으로 링크하면 얇은 페이지가 크롤에 노출된다
  const regionHref = hasRegionLanding(getAllChurches(), church.region)
    ? `/region/${church.region}`
    : undefined;
  const groupSlug = church.denominationGroup
    ? slugFromGroup(church.denominationGroup)
    : undefined;

  /*
    가까운 교회 — **아래 섹션에서 제목·기준 문장·목록을 켜는 조건이다.**

    ⚠️ **지도까지 이 값으로 가르지 않는다.** 좌표가 있으면 이웃이 없어도 그린다 —
    이웃이 없다는 것은 *목록*에 대한 사실이지 **그 교회의 위치를 못 보여줄 이유가
    아니다.** 섹션 주석의 표를 볼 것.
  */
  const nearby = nearbyChurches(getAllChurches(), church);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-8">
        {/*
          되돌아가기 줄의 빈 오른쪽을 사이트 표시에 쓴다 — 세로를 더 쓰지 않는다.
          **검색으로 이 페이지에 바로 들어온 사람에게 여기가 어디인지 알리는 유일한
          자리다.** 상세 89개가 검색 유입의 주 경로라 이 화면이 가장 중요하다.
        */}
        <div className="flex items-center justify-between gap-3">
          {/* 목록으로 돌아가는 이동이라 방향은 후퇴다 */}
          <Link
            href="/churches"
            transitionTypes={NAV_BACK}
            className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-t4 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeft aria-hidden className="size-4" />
            {/* 목적지의 h1·metadata.title·breadcrumb와 같은 이름을 쓴다 (2026-09-08).
                예전에는 상세가 `목록으로`, 랜딩이 `전체 교회 목록`이라 한 곳을 세 이름으로 불렀다 */}
            교회 찾기
          </Link>
          <SiteMark />
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
          {/*
            안내는 주소 바로 밑에 둔다. 이 안내가 한정하는 대상이 주소이고,
            헛걸음을 막으려면 아래 길찾기 버튼을 누르기 전에 읽혀야 한다.
            연락처가 붙는 경우 교회 전화 버튼과 떨어뜨려 두는 효과도 있다 —
            번호 둘이 붙어 있으면 어디로 걸어야 하는지 헷갈린다.
          */}
          {church.notice && <ChurchNotice notice={church.notice} />}
        </div>

        {/*
          전화 걸기가 이 화면의 유일한 brand-solid다.

          **2026-09-23에 `교회 정보` 앞으로 올렸다.** 지도가 화면 맨 위를 차지하던
          동안에는 **이 두 버튼이 첫 화면 밖에 있었다** — `CLAUDE.md`가 "탭 한 번으로
          전화"를 핵심 동선으로 규정해 둔 것과 어긋난다. 지도를 아래로 내리면서
          **주소 → 길찾기·전화**가 스크롤 없이 이어진다.

          Base UI Button은 네이티브 <button>을 전제하므로 링크에는 variant만 빌려 쓴다.
          phone이 없는 1건은 넓은 화면에서도 1열이라 길찾기가 전체 너비를 쓴다.

          **모바일에서는 2열로 쪼개지 않는다 (2026-09-09).** 375px에서 2열이면 한 칸이
          167px인데, 가장 긴 번호(`0507-1312-5303`, 14자)가 그 안에 겨우 들어가서
          **글자 크기·아이콘·굵기를 하나도 못 키우는 상태였다** — 예전에 t5에서 t4로
          내린 것도 그 때문이다(`docs/ui-checklist.md`). 세로로 쌓으면 각 버튼이 343px를
          쓰게 되어 제약이 통째로 사라진다. 넓은 화면(sm 이상)에서는 한 칸이 300px가
          넘으므로 예전처럼 2열로 둔다.

          **길찾기를 outline에서 secondary로 바꿨다.** 투명 배경에 1px 테두리라
          옆(위)의 네이비 버튼과 무게 차이가 너무 컸다. 회색 면을 깔면 둘이 한 쌍의
          블럭으로 읽힌다. **"화면당 brand-solid 하나" 원칙은 그대로다** — secondary는
          solid가 아니고, 전화 걸기가 여전히 유일한 brand-solid다.
        */}
        <div className={cn("mt-6 grid gap-2", church.phone && "sm:grid-cols-2")}>
          <a
            href={directionsUrl(church)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "h-12 w-full text-t5 font-semibold",
            )}
          >
            {/* 기본값 size-4를 덮는다. cva의 `:not([class*='size-'])`가 이 자리를 비워 둔다 */}
            <Navigation aria-hidden className="size-5" />
            길찾기
          </a>
          {church.phone && (
            <a
              href={`tel:${church.phone}`}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 w-full text-t5 font-semibold",
              )}
            >
              <Phone aria-hidden className="size-5" />
              {church.phone}
            </a>
          )}
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
          가까운 교회 (2026-09-23) — **지도가 화면 맨 위에서 여기로 내려왔다.**

          **지도의 성격이 "주소 확인"에서 "주변 탐색"으로 바뀌었다.** 마커 하나를 띄우던
          동안에는 바로 아래 적힌 주소를 그림으로 한 번 더 보여주는 것이 전부였는데,
          그것이 첫 화면에서 세로 211px(375px 기준)을 쓰고 있었다. 지금은 반경 안의
          교회를 함께 찍고 목록으로 잇는다 — **상세에서 다른 교회로 가는 첫 길이다**
          (그전에는 아래 `비슷한 교회 찾기`의 시도 단위 랜딩뿐이었고, 강동구에서 보고
          있는 사람에게 `서울 교회 30곳`은 답이 아니다).

          ⚠️ **목록이 정본이고 지도는 그것을 그린 것이다.** 지도 컨테이너는 `aria-hidden`
          이라 **지도에만 있는 정보를 만들지 않는다.** 정적 HTML에 남는 것도 이 목록이고,
          내부 링크가 되는 것도 이쪽이다.

          ⚠️ **`interactive`를 켜지 않는다.** 본문 중간의 지도가 움직이면 **세로로
          스크롤하려던 손가락을 지도가 먹는다.** 모바일 우선 사이트에서 실제 사고다.

          ⚠️ **`onSelect`를 넘기지 않는다** — 마커는 손끝보다 작아 **오탭이 엉뚱한 교회로
          데려간다.** 이동은 아래 목록이 맡고, 지도는 `labels`로 이름만 말한다.

          **첫 화면 밖이라 `lazy`가 실제로 듣는다** — 지도를 여기로 내린 이유의 절반이다.

          ⚠️ **두 조건이 겹쳐 있다. 섞지 말 것** (2026-09-23에 한 번 섞어서 고쳤다).

          | 무엇 | 조건 |
          |---|---|
          | 섹션과 **지도** | `hasCoords(church)` — 좌표만 있으면 언제나 그린다 |
          | 제목·기준 문장·**목록** | `nearby.length > 0` |

          **반경 안이 비어도 지도는 남는다.** 처음에 `nearby.length > 0` 하나로 묶었다가
          **좌표가 멀쩡한 19건이 원래 있던 지도까지 잃었다** — 이웃이 없다는 것은
          *목록*에 대한 사실이지 *그 교회의 위치*를 못 보여줄 이유가 아니다.

          **"근처에 없다"고 적지는 않는다** — 우리 수록 범위의 한계가 그 지역의 결함처럼
          읽힌다(`ChurchNotice`가 붉은 상자를 버린 것과 같은 판단이다). 대신 제목이
          `위치`로 바뀌어 **그 화면이 무엇을 보여주는지만** 말한다.

          **이름표도 이웃이 있을 때만 켠다** — 이름표는 여럿을 가려 보라고 있는 것이라
          마커가 하나뿐이면 바로 위 h1과 같은 글자가 한 번 더 찍힐 뿐이다.
        */}
        {hasCoords(church) && (
          <section className="mt-8 border-t border-border pt-5">
            <h2 className="text-t4 font-semibold text-foreground">
              {nearby.length > 0 ? "가까운 교회" : "위치"}
            </h2>
            {/*
              고르는 기준을 밝힌다 — `/about`의 **"평가하거나 순위를 매기지 않습니다"**와
              짝이다. 거리 하나로 정해졌다는 것이 보이면 추천 목록으로 읽히지 않는다.
              **숫자는 상수에서 온다** — 반경을 조정하면 문장도 따라온다.
            */}
            {nearby.length > 0 && (
              <p className="mt-1 text-t2 text-muted-foreground">
                직선거리 {NEARBY_RADIUS_KM}km 안에 있는 교회를 가까운 순으로
                보여줍니다.
              </p>
            )}
            <ChurchMap
              churches={[church, ...nearby]}
              focusId={church.id}
              labels={nearby.length > 0}
              lazy
              className="mt-3 aspect-video w-full"
            />
            {/* 홈 미리보기와 같은 행 어휘다 — 상세만의 목록 모양을 새로 만들지 않는다 */}
            {nearby.length > 0 && (
              <ul className="mt-1 divide-y divide-border">
                {nearby.map((neighbor) => (
                  <li key={neighbor.id}>
                    <ChurchRow church={neighbor} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {(regionHref || groupSlug) && (
          <nav className="mt-8 border-t border-border pt-5">
            <h2 className="text-t4 font-semibold text-foreground">
              비슷한 교회 찾기
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {regionHref && (
                <li>
                  <Link
                    href={regionHref}
                    transitionTypes={NAV_BACK}
                    className="inline-block rounded-lg bg-muted px-3 py-1.5 text-t4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {church.region} 교회
                  </Link>
                </li>
              )}
              {groupSlug && church.denominationGroup && (
                <li>
                  <Link
                    href={`/denomination/${groupSlug}`}
                    transitionTypes={NAV_BACK}
                    className="inline-block rounded-lg bg-muted px-3 py-1.5 text-t4 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {church.denominationGroup}
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}

        {/* 공개에 따르는 의무 — 출처를 밝히고 수정·삭제 요청 창구를 안내한다 */}
        <DataNotice source={church.source} churchId={church.id} />

        {/* 검색엔진이 이 교회를 장소로 이해하게 한다. geo(좌표)가 여기 들어간다 */}
        <JsonLd data={churchJsonLd(church)} />
        {/* 이동 경로는 내부 링크와 같은 모양이어야 한다 — 랜딩이 없는 지역이면 그 칸을 뺀다 */}
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "교회 찾기", path: "/churches" },
            ...(regionHref
              ? [{ name: `${church.region} 개혁주의 교회`, path: regionHref }]
              : []),
            { name: church.name, path: `/churches/${church.id}` },
          ])}
        />
      </main>
    </PageTransition>
  );
}
