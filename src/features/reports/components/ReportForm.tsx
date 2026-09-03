"use client";
// 제보 폼 — Server Action으로 GitHub Issues에 등록한다

import { useActionState, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitReport } from "../actions";
import {
  BODY_MAX,
  countGraphemes,
  INITIAL_REPORT_STATE,
  REPORT_KINDS,
  SOURCE_MAX,
} from "../report";

// 상세 페이지에서 `?church=`로 넘어온다. 목록 화면과 같은 이유로 URL을 외부
// 저장소처럼 읽는다 — searchParams를 받으면 라우트가 Dynamic이 된다.
const subscribeToNothing = () => () => {};
const readChurchFromUrl = () =>
  new URLSearchParams(window.location.search).get("church") ?? "";
const noChurchOnServer = () => "";

export function ReportForm() {
  const churchId = useSyncExternalStore(
    subscribeToNothing,
    readChurchFromUrl,
    noChurchOnServer,
  );
  const [state, action, pending] = useActionState(
    submitReport,
    INITIAL_REPORT_STATE,
  );
  const [body, setBody] = useState("");

  const used = countGraphemes(body);
  const over = used > BODY_MAX;

  if (state.status === "ok") {
    return (
      <div className="rounded-lg border border-border bg-muted p-5">
        <p className="text-t5 font-semibold text-foreground">
          {state.messages[0]}
        </p>
        {state.issueNumber && (
          <p className="mt-2 text-t4 text-muted-foreground">
            접수 번호 #{state.issueNumber}
          </p>
        )}
        <p className="mt-3 text-t2 text-muted-foreground">
          되물을 연락처를 받지 않으므로 추가 확인이 필요하면 반영이 늦어질 수
          있습니다.
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
        {REPORT_KINDS.map((kind, index) => (
          <label
            key={kind}
            className="flex items-center gap-2 text-t5 text-foreground"
          >
            <input
              type="radio"
              name="kind"
              value={kind}
              defaultChecked={index === 0}
              className="size-4 accent-primary"
            />
            {kind}
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
        <Textarea
          id="report-body"
          name="body"
          required
          rows={6}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="예) 전화번호가 031-123-4567로 바뀌었습니다."
          className="text-t5"
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

      <Button
        type="submit"
        size="lg"
        disabled={pending || over}
        className="w-full text-t5"
      >
        {pending ? "보내는 중…" : "보내기"}
      </Button>
    </form>
  );
}
