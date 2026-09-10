// 데이터 성격 고지 — 출처·정확성 면책·제보·개인정보 처리방침·데이터 이용 조건을 한 덩어리로 묶는다
//
// **문구를 화면마다 따로 쓰지 않는다.** 같은 말을 다섯 곳에 흩어 놓으면 한쪽만 고쳐져
// 서로 다른 안내가 나가게 된다. 특히 면책은 문장이 조금만 달라도 뜻이 달라진다.
//
// **`/privacy` 도달 경로이기도 하다.** 검색으로 상세 페이지에 바로 들어온 사람은
// 홈을 거치지 않으므로, 이 컴포넌트가 없으면 처리방침으로 갈 길이 없다.
//
// **층을 셋으로 나눈다 (2026-09-08).** 예전에는 세 줄이 전부 t2·muted·mt-1로 완전히
// 균일해서 푸터가 아니라 "작은 문단"으로 읽혔다. 푸터가 푸터로 보이는 것은 대개
// 밀도 차이 때문인데 층이 하나도 없었다. 지금은 ①고지(작게) ②창구(키워서)
// ③닫는 줄(사이트명·이용 조건) 순으로 굵기와 간격이 갈린다.
//
// **이모지를 쓰지 않는다.** 이 사이트의 아이콘은 전부 lucide 단색 스트로크다.
// 이모지는 OS 컬러 폰트라 나란히 두면 혼자 튀고 플랫폼마다 모양이 다르다. 무엇보다
// 이 블록은 출처·면책·삭제 요청 창구를 담은 **법적 고지**라 장식이 격을 바꾼다.
// 여기 아이콘은 하나뿐이고, 그것도 장식이 아니라 **"사이트를 벗어난다"는 신호**다.

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { DATA_LICENSE_URL, SITE_NAME } from "@/lib/site";

/** 창구 링크 — 문장에서 꺼내 t4로 키웠다. 눈에 띄고 탭 영역도 커진다 */
const LINK =
  "rounded-lg text-t4 text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

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
    <footer className="mt-10 border-t border-border pt-6">
      <div className="text-t2 text-muted-foreground">
        {source && <p>출처: {source}</p>}
        {/*
          면책 — 전화번호·주소는 바뀌는 값이고 우리 데이터는 수집 시점에 멈춰 있다.
          헛걸음을 막는 안내이자, 아래 제보 창구로 자연스럽게 잇는 문장이다.
        */}
        <p className={source ? "mt-1" : undefined}>
          정보는 수집 시점 기준이며 정확성을 보증하지 않습니다. 방문 전 교회에
          확인해 주세요.
        </p>
      </div>

      {/*
        **이 사이트의 유일한 제보·삭제 요청 창구다.** 예전에는 `사실과 다르거나
        삭제를 원하시면 알려주세요.`라는 12px 문장 속 밑줄이라 눈에도 안 띄고
        누르기도 어려웠다. 라벨이 `정보 수정·삭제 요청`인 것은 CLAUDE.md가
        "삭제 요청도 받는다고 명시한다"고 못박은 의무를 라벨 자체로 지키기 위해서다.
      */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Link href={reportHref} transitionTypes={NAV_FORWARD} className={LINK}>
          정보 등록·수정·삭제 요청
        </Link>
        <Link href="/privacy" transitionTypes={NAV_FORWARD} className={LINK}>
          개인정보 처리방침
        </Link>
      </div>

      {/*
        닫는 줄 — "사이트가 여기서 끝난다"는 신호이자 데이터 이용 조건을 밝히는 자리다.
        **이용 조건은 지금까지 `/privacy` 본문과 `llms.txt`에만 있었다.** 라이선스를
        밝히는 것은 푸터의 고전적 역할이고, 데이터를 가져가려는 사람이 가장 먼저 보는 곳이다.

        ⚠️ **`CC BY-NC 4.0`이라고만 적지 않는다.** 이 데이터는 CC BY-NC에 **추가 조건**
        (삭제 요청 승계)이 붙어 있고, 그 조항이 핵심이다. 기본 라이선스 이름만 적으면
        재배포자가 그 의무를 모른 채 가져간다. `/privacy`의 `전체 이용 조건 보기`와
        같은 어휘를 쓴다.
      */}
      <div className="mt-6 border-t border-border pt-4 text-t2 text-muted-foreground">
        <p className="flex flex-wrap items-center gap-x-1.5">
          <span>{SITE_NAME}</span>
          <span aria-hidden>·</span>
          {/* 저장소로 나가는 외부 링크다. 아이콘은 장식이 아니라 이탈 신호이며,
              교회 상세의 `홈페이지 열기 ↗`와 같은 문법이다 */}
          <a
            href={DATA_LICENSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            데이터 이용 조건
            <ExternalLink aria-hidden className="size-3" />
          </a>
        </p>
      </div>
    </footer>
  );
}
