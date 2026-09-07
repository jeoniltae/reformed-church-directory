// 교회별 '알려진 한계' 안내 — 데이터에 빈 곳이 있을 때 상세 화면에서 미리 알린다.
//
// **경고가 아니라 안내다.** `destructive`(붉은색)를 쓰지 않는다. 확인하지 못한 것은
// 우리 데이터의 한계이지 그 교회의 결함이 아닌데, 붉은 상자로 감싸면 그 교회가
// 문제인 것처럼 읽힌다. 소형·개척교회 중심 디렉토리에서 이 오독은 실제 해가 된다
// (CLAUDE.md가 교인 수를 넣지 않기로 한 것과 같은 이유다).
//
// **배경 대신 테두리를 쓴다.** 바로 위 지도 자리가 이미 `bg-muted` 덩어리라,
// 회색 블록이 둘 연달아 오면 이것까지 "준비 중"으로 읽힌다.
//
// **brand-solid를 쓰지 않는다.** 화면당 하나라는 원칙에 따라 그 자리는 전화 버튼이
// 가져간다 — 교회에 직접 거는 것이 언제나 첫 번째 동선이어야 한다.

import { Info } from "lucide-react";
import type { Church } from "@/types/church";

export function ChurchNotice({
  notice,
}: {
  notice: NonNullable<Church["notice"]>;
}) {
  return (
    <aside className="mt-4 flex gap-2.5 rounded-lg border border-border p-3">
      <Info
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div>
        <p className="text-t4 text-foreground">{notice.message}</p>
        {notice.contact && (
          <p className="mt-1.5 text-t4 text-muted-foreground">
            {notice.contact.label}{" "}
            {/* 모바일 우선 — 여기도 탭 한 번으로 걸린다 */}
            <a
              href={`tel:${notice.contact.phone}`}
              className="rounded-lg whitespace-nowrap text-foreground underline underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {notice.contact.phone}
            </a>
          </p>
        )}
      </div>
    </aside>
  );
}
