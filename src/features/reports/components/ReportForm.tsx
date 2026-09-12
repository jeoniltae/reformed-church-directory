"use client";
// 제보 폼 — Server Action으로 GitHub Issues에 등록한다

import { Check } from "lucide-react";
import { useActionState, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitReport } from "../actions";
import {
  BODY_MAX,
  clean,
  countGraphemes,
  INITIAL_REPORT_STATE,
  isReportKind,
  REPORT_KINDS,
  SOURCE_MAX,
} from "../report";

// 상세 페이지에서 `?church=`로, `/churches` 목록 끝에서 `?kind=`로 넘어온다.
// 목록 화면과 같은 이유로 URL을 외부 저장소처럼 읽는다 — searchParams를 받으면
// 라우트가 Dynamic이 된다.
const subscribeToNothing = () => () => {};
const readChurchFromUrl = () =>
  new URLSearchParams(window.location.search).get("church") ?? "";
const noChurchOnServer = () => "";
const readKindFromUrl = () =>
  new URLSearchParams(window.location.search).get("kind") ?? "";
const noKindOnServer = () => "";

export function ReportForm() {
  const churchId = useSyncExternalStore(
    subscribeToNothing,
    readChurchFromUrl,
    noChurchOnServer,
  );
  /**
   * 제보 유형. `?kind=`가 있으면 그것으로 시작한다.
   *
   * **초기값 전용이다** — 한 번 고르면 그때부터 URL을 보지 않는다. `/churches`의
   * `?region=` 처리와 같은 구조이며, 목록 끝의 `교회 등록 요청` 버튼이 이 값을 넘긴다.
   *
   * **라디오를 controlled로 바꿔야 했다.** 예전처럼 `defaultChecked`로 두면
   * 하이드레이션 뒤에 값이 바뀌어도 DOM이 따라오지 않는다(마운트 시점에만 읽는
   * 속성이다). 서버 스냅샷이 빈 문자열이라 서버는 늘 첫 항목을 그린 뒤,
   * 하이드레이션 후 URL 값으로 옮겨간다.
   *
   * **목록 밖 값은 무시한다.** 주소창에 아무 문자열이나 넣어도 첫 항목으로 떨어진다.
   */
  const urlKind = useSyncExternalStore(
    subscribeToNothing,
    readKindFromUrl,
    noKindOnServer,
  );
  const [pickedKind, setPickedKind] = useState<string | null>(null);
  const kind =
    pickedKind ?? (isReportKind(urlKind) ? urlKind : REPORT_KINDS[0]);

  const [state, action, pending] = useActionState(
    submitReport,
    INITIAL_REPORT_STATE,
  );
  const [body, setBody] = useState("");

  const used = countGraphemes(body);
  const over = used > BODY_MAX;
  /**
   * **`clean()`으로 비었는지 본다 — `body === ""`가 아니다.** 공백·줄바꿈만
   * 채운 것도 `validateReport`는 빈 것으로 본다("내용을 입력해 주세요.").
   * 여기서도 같은 기준을 써야 "버튼은 눌렸는데 서버가 빈 값이라고 튕기는"
   * 어긋남이 생기지 않는다. `used`(카운터 표시용)는 원문 그대로 두고
   * 이 판정만 `clean()`을 거친다 — 목적이 다르다.
   */
  const empty = clean(body).length === 0;

  if (state.status === "ok") {
    return (
      /*
        접수 확인 화면.

        ⚠️ **배경을 `bg-muted`에서 테두리로 바꿨다.** 바로 위 `page.tsx`의 공개 고지가
        이미 `bg-muted` 덩어리라, 회색 블록이 둘 연달아 오면 같은 안내의 연장으로
        읽혀 "접수됐다"는 신호가 묻힌다. `ChurchNotice`가 지도 자리 밑에서 같은
        이유로 내린 판단과 같다.

        **체크 동그라미가 이 화면의 유일한 brand-solid다.** 보내기 버튼이 사라진
        자리라 "화면당 하나" 원칙과 충돌하지 않는다. 성공을 색으로 말하는 유일한
        수단이기도 하다.
      */
      <div className="rounded-lg border border-border bg-card p-5">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-full bg-primary"
        >
          <Check className="size-6 text-primary-foreground" />
        </span>

        <p className="mt-4 text-t6 font-bold text-foreground">
          {state.messages[0]}
        </p>

        {/*
          **처리 예정 시간을 약속하지 않는다.** 1인 운영이라 "2~3일 내" 같은 기한은
          지킬 수 없는 약속이 되고, 이 프로젝트는 모르는 것을 모른다고 적는 쪽을
          택해 왔다(`data/notices.json`). 대신 **왜 늦어질 수 있는지**를 밝힌다 —
          연락처를 안 받는 것은 이 폼의 설계이므로 그 대가도 함께 말하는 것이 맞다.
        */}
        <p className="mt-2 text-t4 text-muted-foreground">
          보내주신 내용을 확인한 뒤 디렉토리에 반영합니다. 되물을 연락처를 받지
          않으므로 추가 확인이 필요하면 반영이 늦어질 수 있습니다.
        </p>

        {/*
          무엇이 접수됐는지 되짚어 준다. `kind`는 제출 시점의 선택 그대로다 —
          폼이 이 화면으로 교체돼 더 바꿀 수 없다.

          **제목에 유형을 넣지 않은 이유** — `기타가 접수되었습니다`처럼 어색해지고,
          조사(이/가)가 받침에 따라 갈려 유형이 늘면 조용히 틀린다. 제목은 고정하고
          유형은 여기서 사실로만 적는다.
        */}
        <p className="mt-4 border-t border-border pt-4 text-t2 text-muted-foreground">
          {kind}
          {state.issueNumber && ` · 접수 번호 #${state.issueNumber}`}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="churchId" value={churchId} />

      {churchId && (
        <p className="rounded-lg bg-muted px-3 py-2 text-t4 text-muted-foreground">
          대상 교회 <span className="text-foreground">{churchId}</span>
        </p>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-t4 font-semibold text-foreground">
          어떤 제보인가요
        </legend>
        {REPORT_KINDS.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 text-t5 text-foreground"
          >
            <input
              type="radio"
              name="kind"
              value={option}
              checked={kind === option}
              onChange={() => setPickedKind(option)}
              className="size-4 accent-primary"
            />
            {option}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="report-body"
          className="text-t4 font-semibold text-foreground"
        >
          내용
        </label>
        {/*
          **이 폼은 연락처를 받지 않아 되물을 수가 없다.** 교회 등록 요청이 이름만
          적혀 오면 그대로는 `churches.json`에 넣을 수 없고, 물어볼 방법도 없어
          버려진다. 그래서 무엇이 필요한지 미리 알린다.

          placeholder에 넣지 않은 이유 — **첫 글자를 치는 순간 사라진다.** 정작
          적는 동안 보이지 않으면 안내로 쓸모가 없다.
        */}
        <p className="text-t2 text-muted-foreground">
          교회 등록 요청이면 <span className="text-foreground">교회명·주소·교단·담임목사</span>를 함께
          적어 주세요. 되물을 방법이 없어 빠진 항목은 채우지 못합니다.
        </p>
        {/*
          **`field-sizing-fixed`가 핵심이다.** shadcn `Textarea`에 `field-sizing-content`가
          붙어 있어 내용에 따라 상자가 계속 늘어난다 — 그 상태로는 `rows`가 아무
          영향을 주지 않는다. 고정으로 되돌려야 `rows={6}`이 높이를 정하고,
          그보다 길어지면 상자가 커지는 대신 **안에서 세로 스크롤이 생긴다.**

          `resize: none`은 `globals.css`의 공통 규칙에서 온다.
        */}
        <Textarea
          id="report-body"
          name="body"
          required
          rows={6}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="예) 전화번호가 031-123-4567로 바뀌었습니다."
          className="field-sizing-fixed text-t5"
        />
        <p
          className={
            over
              ? "text-right text-t2 text-destructive"
              : "text-right text-t2 text-muted-foreground"
          }
        >
          {used} / {BODY_MAX}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="report-source"
          className="text-t4 font-semibold text-foreground"
        >
          확인하신 곳 <span className="font-normal text-muted-foreground">(선택)</span>
        </label>
        <Input
          id="report-source"
          name="source"
          maxLength={SOURCE_MAX}
          placeholder="예) 교회 홈페이지, 주보"
          className="text-t5"
        />
      </div>

      {state.status === "error" && (
        <ul className="flex flex-col gap-1">
          {state.messages.map((message) => (
            <li key={message} className="text-t4 text-destructive">
              {message}
            </li>
          ))}
        </ul>
      )}

      {/*
        이 화면의 주 액션이라 교회 상세의 길찾기·전화와 같은 무게로 둔다
        (h-12 · t5 · semibold, 2026-09-09). **손가락 기준 44px도 여기서 넘긴다** —
        `size="lg"`는 base-nova에서 h-9(36px)라 그것만으로는 못 미친다.
      */}
      <Button
        type="submit"
        size="lg"
        // **`empty`만 넣는다 — `source`는 넣지 않는다.** 확인하신 곳은 라벨부터
        // "(선택)"이고 `validateReport`도 비어 있으면 통과시킨다(테스트로 고정돼
        // 있다). 여기서 채우라고 강제하면 화면 안내와 실제 검증 규칙이 어긋난다.
        disabled={pending || over || empty}
        className="h-12 w-full text-t5 font-semibold"
      >
        {pending ? "보내는 중…" : "보내기"}
      </Button>
    </form>
  );
}
