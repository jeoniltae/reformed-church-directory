"use client";
// 교회 목록 화면의 컨테이너 — 검색어·지역 상태를 들고 검색바·지역칩·카드 목록을 조합한다

import Link from "next/link";
import {
  startTransition,
  useMemo,
  useState,
  useSyncExternalStore,
  ViewTransition,
} from "react";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { Button, buttonVariants } from "@/components/ui/button";
// 유형 이름을 문자열로 복사하지 않으려고 reports의 상수를 가져온다.
// 이미 이 목록은 `/report`로 링크하고 있어 라우팅 수준의 결합은 있던 것이다.
import { KIND_REGISTER } from "@/features/reports/report";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";
import {
  collectDenominationGroups,
  collectRegions,
  filterChurches,
} from "../search";
import { ALL, ChipFilter } from "./ChipFilter";
import { ChurchCard } from "./ChurchCard";
import { ChurchSearchBar } from "./ChurchSearchBar";

// 홈의 지역 타일이 넘기는 `?region=`을 읽는다.
// 서버에서 searchParams를 받으면 라우트가 Dynamic이 되고, useSearchParams()를 쓰면
// Suspense 경계가 필요해져 교회 목록이 정적 HTML에서 빠진다. 둘 다 피하려고
// URL을 외부 저장소로 취급한다 — 서버 스냅샷이 비어 있어 하이드레이션도 어긋나지 않는다.
/**
 * 처음에 펼쳐 보일 교회 수.
 *
 * **89건이면 카드 한 장이 110~130px이라 목록이 16화면쯤 된다.** 스크롤을 줄이려고
 * 두는 값이고, 나머지는 `hidden`으로 접었다가 버튼으로 편다.
 */
const INITIAL_VISIBLE = 20;

const subscribeToNothing = () => () => {};
const readRegionFromUrl = () =>
  new URLSearchParams(window.location.search).get("region") ?? "";
const noRegionOnServer = () => "";

export function ChurchDirectory({ churches }: { churches: Church[] }) {
  const [query, setQuery] = useState("");
  const regions = useMemo(() => collectRegions(churches), [churches]);
  const groups = useMemo(() => collectDenominationGroups(churches), [churches]);

  const urlRegion = useSyncExternalStore(
    subscribeToNothing,
    readRegionFromUrl,
    noRegionOnServer,
  );
  // 칩을 한 번이라도 누르면 그때부터는 URL을 보지 않는다 (초기값 전용)
  const [picked, setPicked] = useState<string | null>(null);
  const region = picked ?? (regions.includes(urlRegion) ? urlRegion : ALL);

  // 교단은 URL로 들어오는 경로가 없어 지역 같은 초기값 처리가 필요 없다
  const [group, setGroup] = useState(ALL);

  /**
   * **한 번 펼치면 계속 펼친 상태로 둔다.** 필터를 바꿀 때 접기로 되돌리지 않는다 —
   * "다 보겠다"는 의사표시는 검색어보다 오래 간다. 필터로 결과가 20건 아래로 줄면
   * 어차피 전부 보이므로 되돌릴 이유도 없다.
   */
  const [expanded, setExpanded] = useState(false);

  /**
   * 카드마다 붙일 `view-transition-name`.
   *
   * **필터가 바뀌어도 같은 교회는 같은 이름을 가져야** 브라우저가 "같은 카드가
   * 자리를 옮겼다"고 알아보고 미끄러뜨린다. 그래서 필터 결과의 순번이 아니라
   * **원본 배열의 순번**으로 만든다.
   *
   * **id를 그대로 쓰지 않는 이유** — id가 `언약교회-하남시`처럼 한글이다.
   * CSS 식별자에 한글이 못 쓰이는 것은 아니지만, 이 프로젝트는 경로 한글 때문에
   * 이미 두 번 발목을 잡혔다(빌드 사망 / 리다이렉트 무효). 굳이 세 번째를 만들지 않는다.
   */
  const vtName = useMemo(
    () => new Map(churches.map((church, index) => [church.id, `church-${index}`])),
    [churches],
  );

  /**
   * 결과 안내에 쓰는 "무엇을 기준으로" 부분.
   *
   * 검색어를 먼저 두는 것은 사용자가 마지막에 한 조작이 대개 입력이기 때문이다.
   * **아무 조건도 없으면 `전체`다** — 빈 문자열로 두면 `9곳을 찾았습니다`가 되어
   * 무엇 중에서 찾은 것인지 사라진다.
   */
  const scope =
    [
      query.trim() && `"${query.trim()}"`,
      region !== ALL && region,
      group !== ALL && group,
    ]
      .filter(Boolean)
      .join(" · ") || "전체";

  const results = useMemo(
    () =>
      filterChurches(churches, {
        q: query,
        region: region === ALL ? undefined : region,
        denominationGroup: group === ALL ? undefined : group,
      }),
    [churches, query, region, group],
  );

  return (
    <div className="flex flex-col gap-4">
      <ChurchSearchBar value={query} onChange={setQuery} />

      {/* 두 줄을 한 덩어리로 붙여 검색바·목록과 구분한다 */}
      <div className="flex flex-col gap-2">
        {/*
          **칩 클릭만 전환으로 감싼다.** `<ViewTransition>`은 `startTransition` 안의
          갱신에서만 발동하는데, 검색 입력까지 감싸면 **글자를 칠 때마다 목록 전체가
          애니메이션**해서 타이핑이 방해받는다. 칩은 한 번에 하나씩 바뀌는 조작이라
          재배열이 읽히지만, 타이핑은 결과가 연속으로 흐르므로 움직임이 소음이 된다.
        */}
        <ChipFilter
          label="지역"
          tone="neutral"
          options={regions}
          selected={region}
          onSelect={(value) => startTransition(() => setPicked(value))}
        />
        <ChipFilter
          label="교단"
          tone="brand"
          options={groups}
          selected={group}
          onSelect={(value) => startTransition(() => setGroup(value))}
        />
      </div>

      {results.length === 0 ? (
        <p className="py-12 text-center text-t4 text-muted-foreground">
          조건에 맞는 교회가 없습니다.
        </p>
      ) : (
        <>
          {/*
            **접는 것이지 잘라내는 것이 아니다.** `slice()`로 20개만 렌더하면 정적
            HTML에서 나머지가 통째로 빠져 무한 스크롤과 같은 SEO 손실이 난다
            (`useSearchParams()`를 피한 것과 같은 이유다). `hidden`은 DOM에 그대로
            두고 화면에만 안 보이게 하므로 **크롤러는 89개 링크를 전부 본다.**
          */}
          {/*
            결과 안내 — 필터를 걸면 몇 곳이 남았는지 알 수 있는 곳이 여기뿐이다.
            (상단 문구는 수록 총계라 필터와 무관하게 89곳으로 고정이다.)

            **숫자만 두었을 때는 눈에 띄지 않았다.** 무엇을 기준으로 몇 곳인지
            문장으로 말해 주는 편이 읽히고, 칩에서 고른 조건이 문장에 다시 나오므로
            "내가 무엇을 걸었는지"도 함께 확인된다.

            **롤은 `key`가 아니라 View Transition으로 한다.** `key`로 다시 마운트하면
            새 줄이 올라오기만 하고 옛 줄이 빠지지 않아 slideUp이 된다. 브라우저가
            옛 화면을 스냅샷으로 들고 있어야 **옛 줄이 위로 나가고 새 줄이 아래에서
            들어오는** 진짜 롤이 된다.

            ⚠️ **`update`가 핵심이다.** 이 `<p>`는 마운트·언마운트되지 않고 **안의 글자만
            바뀌므로** `enter`/`exit`로는 아무 일도 일어나지 않는다(실제로 그렇게 만들었다가
            움직이지 않는 것을 확인했다). 결과가 0이 되면 아래 빈 상태로 교체되면서
            정말로 언마운트되므로 `enter`/`exit`도 함께 둔다.
          */}
          <ViewTransition
            name="result-note"
            update="note-roll"
            enter="note-roll"
            exit="note-roll"
          >
            <p className="text-t4 text-muted-foreground">
              {scope}{" "}
              <strong className="font-semibold text-foreground">
                {results.length}곳
              </strong>
              을 찾았습니다{" "}
              {/* 장식이라 스크린리더가 매번 "웃는 얼굴"을 읽지 않게 감춘다 */}
              <span aria-hidden>😊</span>
            </p>
          </ViewTransition>

          <ul className="flex flex-col gap-2">
            {results.map((church, index) => (
              /*
                같은 교회에 같은 이름이 붙으므로 브라우저가 "이 카드가 자리를
                옮겼다"고 알아보고 미끄러뜨린다. 빠지는 카드는 줄며 사라지고
                새 카드는 자라난다 — CSS는 globals.css의 `.card-*`에 있다.
              */
              <ViewTransition
                key={church.id}
                name={vtName.get(church.id)}
                enter="card-enter"
                exit="card-exit"
                update="card-move"
              >
                <li hidden={!expanded && index >= INITIAL_VISIBLE}>
                  <ChurchCard church={church} />
                </li>
              </ViewTransition>
            ))}
          </ul>

          {/*
            무한 스크롤 대신 버튼이다 — 스크롤로 늘어나면 아래 푸터(삭제 요청 창구·
            개인정보 처리방침)에 영영 닿지 못한다. 화면에 brand-solid가 없지만
            여기에 쓰지 않는다. 목록이 주인공이고 이건 보조 동작이다.
          */}
          {!expanded && results.length > INITIAL_VISIBLE && (
            <Button
              variant="outline"
              size="lg"
              className="w-full text-t4"
              onClick={() => setExpanded(true)}
            >
              교회 {results.length - INITIAL_VISIBLE}곳 모두 보기
            </Button>
          )}

          {/*
            목록 끝 — 전부 봤는데도 못 찾은 사람에게 등록 요청 창구를 연다.
            **수록 범위가 좁은 개혁주의라 자기 교회가 빠진 것을 발견하는 사람이
            실제로 나온다**(`REPORT_KINDS`에 `교회 등록 요청`을 넣은 것과 같은 이유다).
            창구가 여기 없으면 그 사람은 푸터의 `정보 등록·수정·삭제 요청`을 찾아내야 한다.

            **조건은 "결과 전부가 화면에 있다"이지 "펼침 버튼을 눌렀다"가 아니다.**
            `expanded`만 보면 두 가지가 어긋난다. ① 필터로 20건 아래로 줄어 버튼이
            아예 안 나온 경우 — 목록을 다 봤는데도 안내가 없다. ② `expanded`는 한 번
            켜지면 계속 켜져 있어서, 같은 4건짜리 화면이 "펼친 적 있으면 보이고
            없으면 안 보이는" 이력 의존 상태가 된다.

            **brand-solid를 쓰지 않는다.** 위 `모두 보기`와 같은 판단이다 — 목록이
            주인공이고 이건 보조 동작이다. 높이도 36px로 두어 "주 액션 48px /
            보조 36px" 위계를 지킨다.

            **`Button`에 `render={<Link/>}`를 넘기지 않는다.** base-nova의 Button은
            네이티브 `<button>`을 전제한다. 링크에는 `buttonVariants`만 빌려 쓰고
            반드시 `cn()`으로 감싼다 — 안 그러면 base의 `border-transparent`가
            outline의 `border-border`를 덮어 테두리가 사라진다.
          */}
          {(expanded || results.length <= INITIAL_VISIBLE) && (
            <div className="mt-4 flex flex-col items-center gap-2 text-center">
              <p className="text-t5 font-semibold text-foreground">
                {results.length}곳을 모두 보셨습니다
              </p>
              <p className="text-t4 text-muted-foreground">
                찾으시는 교회가 없다면 등록을 요청해주세요. 확인 후 디렉토리에
                반영합니다.
              </p>
              {/*
                목록 → 제보는 본문 링크를 타고 들어가는 이동이라 forward다.
                **`?kind=`로 유형을 미리 골라 준다** — 안 넘기면 폼의 기본 선택이
                `정보 수정`이라, 등록하러 온 사람이 유형을 다시 골라야 해서
                이 버튼의 목적이 절반쯤 흐려진다. 값은 `KIND_REGISTER` 상수를
                양쪽이 공유하므로 이름이 바뀌어도 링크가 함께 따라온다.
              */}
              <Link
                href={`/report?kind=${encodeURIComponent(KIND_REGISTER)}`}
                transitionTypes={NAV_FORWARD}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-2 text-t4",
                )}
              >
                교회 등록 요청
              </Link>
            </div>
          )}
        </>
      )}

    </div>
  );
}
