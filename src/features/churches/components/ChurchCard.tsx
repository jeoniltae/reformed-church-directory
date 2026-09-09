// 목록의 교회 카드 한 장 — 모노그램·주소·담임목사·교단 배지에 전화 걸기 버튼을 붙인다

import { MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";

export function ChurchCard({ church }: { church: Church }) {
  return (
    // 카드 전체가 상세로 이어지지만 전화 링크는 그 위에 따로 선다.
    // <a> 안에 <a>를 넣을 수 없어 제목 링크를 카드 넓이만큼 늘리는 방식을 쓴다
    /*
      **누름 상태(`active:`)는 `hover:`로 대신할 수 없다.** 터치에는 hover가 없어서
      모바일에서는 탭한 뒤 화면이 바뀔 때까지 아무 반응이 없었다 — Slow 4G·CPU 4x
      실측에서 프리페치가 안 걸린 카드는 탭 후 **150ms까지 화면이 픽셀 단위로 동일**했다
      (프리페치는 89건 중 35건에서 멈추고, 카드가 화면에 들어온 뒤 약 2초간은 cold다).

      1px 눌림은 `buttonVariants` 기반에 이미 있는 이 디자인 시스템의 탭 피드백
      어휘다(`active:not-aria-[haspopup]:translate-y-px`). 링크 표면에만 없었다.
      **회색 채움만으로는 약하다** — `--muted`가 흰색보다 3%밖에 안 어두워서, 색이
      옅어도 즉시 읽히도록 움직임을 함께 준다. `transition-colors`는 색만 물리므로
      눌림은 지연 없이 붙고 채움만 부드럽게 든다.

      ⚠️ **`has-[a:active]`로 쓰면 안 된다.** 그러면 아래 전화 버튼을 눌러도 카드
      전체가 눌려, 상세로 넘어가는 것처럼 잘못 읽힌다. 카드를 여는 링크는 제목
      하나뿐이므로 `data-nav`로 그것만 집는다.
    */
    <div className="relative flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted has-[a[data-nav]:active]:translate-y-px has-[a[data-nav]:active]:bg-muted has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-t5 font-semibold text-muted-foreground"
      >
        {[...church.name][0]}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/churches/${church.id}`}
            transitionTypes={NAV_FORWARD}
            // data-nav — 카드를 여는 링크임을 표시한다. 위 컨테이너의 누름 상태가
            // 전화 버튼이 아니라 이 링크에만 반응하게 하는 표식이다
            data-nav
            className="truncate text-t6 font-semibold text-foreground outline-none after:absolute after:inset-0"
          >
            {church.name}
          </Link>
          {church.denomination && (
            <Badge variant="secondary" className="mt-0.5 shrink-0">
              {church.denomination}
            </Badge>
          )}
        </div>
        <p className="mt-1.5 flex gap-1.5 text-t4 text-muted-foreground">
          <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {church.address}
        </p>
        <p className="mt-1 flex gap-1.5 text-t2 text-muted-foreground">
          <User aria-hidden className="mt-0.5 size-3 shrink-0" />
          {church.pastor} 목사
        </p>
      </div>

      {church.phone && (
        <a
          href={`tel:${church.phone}`}
          aria-label={`${church.name} 전화 걸기`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "icon" }),
            "relative self-center",
          )}
        >
          <Phone aria-hidden />
        </a>
      )}
    </div>
  );
}
