// 개인정보 처리방침 — 로그인·DB가 없는 정적 사이트 기준. 공개에 따르는 의무의 일부

import type { Metadata } from "next";
import Link from "next/link";
import { NAV_BACK, PageTransition } from "@/components/shared/PageTransition";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description:
    "이 사이트가 다루는 정보의 성격과 출처, 방문자로부터 수집하지 않는 것, 정보 수정·삭제를 요청하는 방법을 안내합니다.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "1. 이 사이트가 다루는 정보",
    body: (
      <>
        <p>
          교회명·주소·교단·담임목사 성함·전화번호·홈페이지 등 교회 소개에
          해당하는 정보를 싣고 있습니다. 대부분 교단이 공개한 자료나 교회가
          스스로 알린 대표 연락처이지만, 개척교회·소형교회는 대표번호가 담임
          목사 개인 휴대폰인 경우가 있습니다.
        </p>
        <p className="mt-2">
          방문자가 아니라 <strong className="font-medium text-foreground">
            교회(정보주체)
          </strong>{" "}
          쪽 정보를 다룬다는 점에서 일반적인 회원제 서비스와 다릅니다.
        </p>
      </>
    ),
  },
  {
    title: "2. 수집 경위",
    body: (
      <p>
        자체 보유 자료와 교단이 공개한 디렉토리를 정리해 실었습니다. 주소는
        행정안전부 도로명주소 API로 표기를 표준화했고, 지도 표시를 위한
        좌표도 같은 경로로 얻었습니다. 교회 상세 페이지마다 수집 출처를
        밝힙니다.
      </p>
    ),
  },
  {
    title: "3. 방문자로부터는 수집하지 않는 것",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>로그인 기능이 없어 계정·비밀번호를 만들지 않습니다.</li>
        <li>
          쿠키나 방문 분석 도구를 쓰지 않습니다. 방문 기록을 별도로 남기지
          않습니다.
        </li>
        <li>
          <Link
            href="/report"
            transitionTypes={NAV_BACK}
            className="text-foreground underline underline-offset-2"
          >
            제보 폼
          </Link>
          도 이름·연락처·이메일을 받는 항목이 없습니다. 보내주신 내용은 그대로
          공개 저장소의 이슈가 되므로, 폼 자체가 개인적인 내용을 적지 말아
          달라고 안내합니다.
        </li>
      </ul>
    ),
  },
  {
    title: "4. 정보 수정·삭제를 요청하는 방법",
    body: (
      <p>
        본인 또는 소속 교회에 관한 정보가 사실과 다르거나 삭제를 원하시면{" "}
        <Link
          href="/report"
          transitionTypes={NAV_BACK}
          className="text-foreground underline underline-offset-2"
        >
          제보 폼
        </Link>
        의 &ldquo;삭제 요청&rdquo; 유형으로 알려주세요. 로그인이나 별도 인증
        없이 보낼 수 있습니다. 삭제가 확인되면 목록에서 제외하고, 이후
        자료를 다시 정리하더라도 같은 교회가 되살아나지 않도록 제외 목록에
        등록해 관리합니다.
      </p>
    ),
  },
  {
    title: "5. 보유 및 처리 방식",
    body: (
      <p>
        접수함으로 GitHub Issues를 쓰고 있어, 제보 처리 이력은 공개 저장소에
        남습니다. 다만 이슈에 개인정보를 적지 않도록 폼에서부터 막고 있으므로
        이력 자체에는 민감한 내용이 남지 않습니다. 반영은 자료를 관리하는
        커밋으로 이루어지며 별도의 보유 기간을 두지 않고 확인 즉시 처리합니다.
      </p>
    ),
  },
  {
    title: "6. 문의",
    body: (
      <p>
        이 방침이나 실린 정보에 대해 궁금한 점이 있으면{" "}
        <Link
          href="/report"
          transitionTypes={NAV_BACK}
          className="text-foreground underline underline-offset-2"
        >
          제보 폼
        </Link>
        의 &ldquo;기타&rdquo; 유형으로 남겨 주세요.
      </p>
    ),
  },
] as const;

export default function PrivacyPage() {
  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        <h1 className="text-t8 font-bold text-foreground">
          개인정보 처리방침
        </h1>
        <p className="mt-1 text-t4 text-muted-foreground">시행일 2026-09-03</p>

        <div className="mt-6 flex flex-col gap-6">
          {SECTIONS.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-t6 font-semibold text-foreground">
                {title}
              </h2>
              <div className="mt-2 text-t4 leading-relaxed text-muted-foreground">
                {body}
              </div>
            </section>
          ))}
        </div>

        <Link
          href="/report"
          transitionTypes={NAV_BACK}
          className="mt-8 inline-block rounded-lg text-t4 text-muted-foreground underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          제보 폼으로 이동
        </Link>
      </main>
    </PageTransition>
  );
}
