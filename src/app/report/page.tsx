// 제보 화면 — 정보 수정·삭제 요청·교회 등록 요청을 GitHub Issues로 받는다
// 받는 유형의 목록은 `features/reports/report.ts`의 `REPORT_KINDS` 하나가 정한다

import type { Metadata } from "next";
import Link from "next/link";
import {
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { SiteMark } from "@/components/shared/SiteMark";
import { ReportForm } from "@/features/reports/components/ReportForm";
import { CONTACT_EMAIL, pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "제보하기",
  description:
    "잘못된 교회 정보나 빠진 교회를 알려주세요. 교회 정보 삭제 요청도 받습니다. 로그인 없이 보낼 수 있습니다.",
  path: "/report",
});

export default function ReportPage() {
  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        {/* 되돌아가기 줄이 없는 화면이라 제목 위에 한 줄로 둔다 */}
        <SiteMark className="mb-3" />
        <h1 className="text-t8 font-bold text-foreground">제보하기</h1>
        {/* 유형이 늘면 이 문장도 함께 고친다 — 화면 안내와 실제로 받는 것이 어긋나면 안 된다 */}
        <p className="mt-1 text-t4 text-muted-foreground">
          잘못된 정보나 빠진 교회가 있으면 알려주세요. 교회 정보 삭제 요청도
          여기서 받습니다. 로그인 없이 바로 보낼 수 있습니다.
        </p>

        {/*
          공개에 따르는 의무이자 개인정보 보호선이다.
          받은 내용이 그대로 공개 저장소의 이슈가 되므로 먼저 알린다.
        */}
        <div className="mt-5 mb-6 rounded-lg border border-border bg-muted p-4">
          <p className="text-t4 font-semibold text-foreground">
            보내주신 내용은 누구나 볼 수 있게 공개됩니다
          </p>
          <p className="mt-1 text-t4 text-muted-foreground">
            제보는 GitHub 공개 저장소에 그대로 올라갑니다. 그러니{" "}
            <span className="text-foreground">
              전화번호나 이메일, 개인적인 사정은 적지 말아 주세요.
            </span>{" "}
            연락처를 따로 묻지 않는 것도 그래서입니다. 자세한 내용은{" "}
            <Link
              href="/privacy"
              transitionTypes={NAV_FORWARD}
              className="text-foreground underline underline-offset-2"
            >
              개인정보 처리방침
            </Link>
            에 있습니다.
          </p>
          {/*
            "개인적인 사정은 적지 말라"고 했으니 그런 내용을 보낼 곳도 함께 알린다.
            `기타 문의`로 쓰지 않는다 — 폼의 `기타` 유형과 창구가 겹친다.
            문구는 개인정보 처리방침의 같은 안내와 맞췄다.
          */}
          <p className="mt-2 text-t4 text-muted-foreground">
            공개된 곳에 남기기 어려운 내용이라면{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-foreground underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            로 보내 주세요.
          </p>
        </div>

        <ReportForm />
      </main>
    </PageTransition>
  );
}
