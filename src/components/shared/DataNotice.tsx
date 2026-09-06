// 데이터 성격 고지 — 출처·정확성 면책·제보·개인정보 처리방침을 한 덩어리로 묶는다
//
// **문구를 화면마다 따로 쓰지 않는다.** 같은 말을 다섯 곳에 흩어 놓으면 한쪽만 고쳐져
// 서로 다른 안내가 나가게 된다. 특히 면책은 문장이 조금만 달라도 뜻이 달라진다.
//
// **`/privacy` 도달 경로이기도 하다.** 검색으로 상세 페이지에 바로 들어온 사람은
// 홈을 거치지 않으므로, 이 컴포넌트가 없으면 처리방침으로 갈 길이 없다.

import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";

const LINK =
  "rounded-lg text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

interface DataNoticeProps {
  /** 교회 상세에서만 넘긴다. 목록·랜딩은 여러 교회를 모아 보여주므로 개별 출처가 없다 */
  source?: string;
  /** 제보 폼에 대상 교회를 미리 채워 넣는다 */
  churchId?: string;
}

export function DataNotice({ source, churchId }: DataNoticeProps) {
  const reportHref = churchId
    ? `/report?church=${encodeURIComponent(churchId)}`
    : "/report";

  return (
    <div className="mt-8 border-t border-border pt-5 text-t2 text-muted-foreground">
      {source && <p>출처: {source}</p>}
      {/*
        면책 — 전화번호·주소는 바뀌는 값이고 우리 데이터는 수집 시점에 멈춰 있다.
        헛걸음을 막는 안내이자, 제보 창구로 자연스럽게 잇는 문장이다.
      */}
      <p className={source ? "mt-1" : undefined}>
        정보는 수집 시점 기준이며 정확성을 보증하지 않습니다. 방문 전 교회에
        확인해 주세요.
      </p>
      <p className="mt-1">
        사실과 다르거나 삭제를 원하시면{" "}
        <Link href={reportHref} transitionTypes={NAV_FORWARD} className={LINK}>
          알려주세요
        </Link>
        .{" "}
        <Link href="/privacy" transitionTypes={NAV_FORWARD} className={LINK}>
          개인정보 처리방침
        </Link>
      </p>
    </div>
  );
}
