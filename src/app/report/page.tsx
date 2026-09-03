// 제보 화면 — 정보 수정·삭제 요청을 GitHub Issues로 받는다

import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { ReportForm } from "@/features/reports/components/ReportForm";

export const metadata: Metadata = {
  title: "제보하기",
  description:
    "교회 정보가 사실과 다르거나 삭제를 원하시면 알려주세요. 로그인 없이 보낼 수 있습니다.",
  alternates: { canonical: "/report" },
};

export default function ReportPage() {
  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        <h1 className="text-t8 font-bold text-foreground">제보하기</h1>
        <p className="mt-1 text-t4 text-muted-foreground">
          정보가 사실과 다르거나 삭제를 원하시면 알려주세요. 로그인은 필요하지
          않습니다.
        </p>

        {/*
          공개에 따르는 의무이자 개인정보 보호선이다.
          받은 내용이 그대로 공개 저장소의 이슈가 되므로 먼저 알린다.
        */}
        <div className="mt-5 mb-6 rounded-lg border border-border bg-muted p-4">
          <p className="text-t4 font-semibold text-foreground">
            보내주신 내용은 공개된 곳에 그대로 올라갑니다
          </p>
          <p className="mt-1 text-t4 text-muted-foreground">
            접수함으로 공개 저장소의 이슈를 씁니다. 누구나 볼 수 있으니{" "}
            <span className="text-foreground">
              연락처·이메일이나 개인적인 사정은 적지 말아 주세요.
            </span>{" "}
            이 폼도 그런 항목을 묻지 않습니다. 자세한 내용은{" "}
            <Link
              href="/privacy"
              className="text-foreground underline underline-offset-2"
            >
              개인정보 처리방침
            </Link>
            에 있습니다.
          </p>
        </div>

        <ReportForm />
      </main>
    </PageTransition>
  );
}
