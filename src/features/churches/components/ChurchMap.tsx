"use client";

// 교회 지도 — Kakao SDK를 감싸는 유일한 컴포넌트. 상세와 `/map`이 함께 쓴다
//
// **SDK를 만지는 곳을 여기 하나로 묶는다.** 로드 실패·정리(cleanup)·좌표 변환을
// 화면마다 따로 쓰면 어긋난다. 바깥은 `Church[]`만 넘기고 나머지는 모른다.
//
// ⚠️ **이 프로젝트에 처음 들어오는 무거운 클라이언트 의존성이다.** 지금까지 클라이언트
// 컴포넌트는 `ChurchDirectory`·`ChipFilter`류뿐이고 전부 가벼웠다. **어느 화면에서
// 언제 마운트되는지가 곧 성능 문제**가 된다(`docs/지도-작업.md` 7단계).

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_FORWARD } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";
import type { Church } from "@/types/church";
import { createChurchBubble } from "../map/bubble";
import { loadKakaoMaps } from "../map/load-kakao";
import { centerOf, toMapPoints } from "../map/points";

type Status = "loading" | "ready" | "failed";

/**
 * 드래그를 허용할 기기인가.
 *
 * ⚠️ **터치 기기에서는 끈다.** 상세의 지도는 본문 한가운데 있어서, 드래그를 허용하면
 * **아래로 스크롤하려고 지도 위에서 움직인 손가락을 지도가 먹어** 페이지가 안 내려간다.
 * 카카오 SDK에는 구글 지도의 `cooperative` 제스처(두 손가락일 때만 조작) 같은 선택지가
 * 없어서, 켜면 이 사고를 피할 방법이 마땅치 않다.
 *
 * **마우스에서는 켠다.** 휠로 페이지를 스크롤하므로 드래그를 막을 이유가 없고,
 * 막아 두면 **데스크톱에서는 고장난 화면처럼 보인다**(2026-09-19 지적받았다).
 *
 * ⚠️ **휠 확대는 양쪽 다 끈 채로 둔다**(`scrollwheel: false`). 켜면 페이지를 스크롤하다
 * 지도 위를 지나는 순간 **화면이 멈추고 지도가 확대된다.**
 */
function canDrag(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

/**
 * 마커를 묶기 시작하는 지도 레벨 (`level >= MIN_CLUSTER_LEVEL`이면 묶는다).
 *
 * ⚠️ **2,118건 확장을 전제로 처음부터 넣는다.** 2,000개를 그대로 찍으면 모바일에서
 * 못 버틴다. 나중에 얹는 것이 아니라는 결정이 `docs/지도-작업.md` 4단계에 있다.
 *
 * **8은 축척 2km다.** 그보다 넓게 보는 동안(전국·시도)은 묶고, 더 당기면 낱개로 푼다
 * — 동네를 보는 배율에서는 교회가 몇 곳 없어 겹치지 않는다. 전국 시야가 레벨 13이라
 * 첫 화면은 언제나 묶인 상태로 열린다.
 *
 * **교회 상세의 지도에는 영향이 없다.** 그쪽은 마커 하나에 레벨 4라 임계값 아래다.
 */
const MIN_CLUSTER_LEVEL = 8;

/**
 * 묶음을 눌렀을 때 당길 레벨 수.
 *
 * ⚠️ **SDK 기본값(한 단계)으로는 너무 멀다 — 실측했다.** 전국(레벨 13)에서 시작하므로
 * 묶임이 풀리는 레벨 7까지 **다섯 번을 눌러야 한다.** 모바일에서 다섯 번은 포기하는 수다.
 *
 * **경계에 맞추는 방법(`setBounds`)을 쓰지 않았다.** 수도권 묶음은 57곳이 서울·경기에
 * 걸쳐 있어 **경계를 다 담으면 한두 단계밖에 안 당겨진다** — 가장 큰 묶음에서 가장
 * 덜 듣는다. 3단계 고정이면 전국에서 **두 번**이면 낱개가 된다(13 → 10 → 7).
 */
const CLUSTER_ZOOM_STEP = 3;

/** 카카오의 가장 가까운 레벨. 이보다 작은 값을 주면 안 된다 */
const MAX_ZOOM_LEVEL = 1;

interface ChurchMapProps {
  /** 좌표 없는 건이 섞여 있어도 된다 — `toMapPoints`가 걸러낸다 */
  churches: Church[];
  /**
   * 한 곳만 보여줄 때의 확대 단계(작을수록 확대). 여러 곳이면 **경계에 맞춰
   * 자동으로 정해지므로 이 값은 무시된다.**
   */
  level?: number;
  /**
   * 기기와 무관하게 조작을 강제로 켠다. `/map`처럼 **지도가 화면의 주인공**일 때만 쓴다.
   *
   * **기본값(`false`)은 "끈다"가 아니라 "기기에 맡긴다"는 뜻이다** — 아래
   * `canDrag()` 참고.
   */
  interactive?: boolean;
  /**
   * 마커를 누르면 말풍선이 뜨고, 말풍선을 누르면 그 교회 상세로 간다.
   *
   * **상세 화면에서는 켜지 않는다** — 마커가 지금 보고 있는 교회 하나뿐이라
   * 자기 자신으로 가는 링크가 된다. `/map`처럼 **여러 교회를 늘어놓는 화면**의 것이다.
   */
  linkToDetail?: boolean;
  className?: string;
}

export function ChurchMap({
  churches,
  level = 4,
  interactive = false,
  linkToDetail = false,
  className,
}: ChurchMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const router = useRouter();

  useEffect(() => {
    // 언마운트 뒤에 도착한 응답이 상태를 건드리지 않게 한다
    let alive = true;
    const markers: kakao.maps.Marker[] = [];
    let clusterer: kakao.maps.MarkerClusterer | null = null;
    // 화면에 떠 있는 말풍선은 언제나 하나다
    let bubble: kakao.maps.CustomOverlay | null = null;
    const closeBubble = () => {
      bubble?.setMap(null);
      bubble = null;
    };

    loadKakaoMaps()
      .then(() => {
        if (!alive || !container.current) return;

        const points = toMapPoints(churches);
        const center = centerOf(points);

        const map = new kakao.maps.Map(container.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level,
          draggable: interactive || canDrag(),
          scrollwheel: interactive,
        });

        for (const point of points) {
          const marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(point.lat, point.lng),
            title: point.name,
            clickable: linkToDetail,
          });
          markers.push(marker);

          if (!linkToDetail) continue;

          kakao.maps.event.addListener(marker, "click", () => {
            // 한 번에 하나만 띄운다 — 옆 마커를 누르면 그쪽으로 옮겨간다
            closeBubble();
            bubble = new kakao.maps.CustomOverlay({
              position: new kakao.maps.LatLng(point.lat, point.lng),
              content: createChurchBubble(point, () => {
                /*
                  ⚠️ **`transitionTypes`를 빠뜨리면 화면 전환이 조용히 죽는다.**
                  `<Link>`가 아니라 라우터로 이동하므로 방향을 직접 실어야 한다
                  (`CLAUDE.md` "화면 전환"). `router.push`의 두 번째 인자로 간다.
                */
                router.push(`/churches/${point.id}`, {
                  transitionTypes: NAV_FORWARD,
                });
              }),
              yAnchor: 1,
              // 기본값이 `false`라 이걸 빼면 말풍선 안의 링크가 눌리지 않는다
              clickable: true,
            });
            bubble.setMap(map);
          });
        }

        /*
          ⚠️ **마커를 지도에 직접 붙이지 않는다.** 클러스터러가 대신 붙이고 뗀다 —
          `marker.setMap(map)`을 함께 부르면 **묶여야 할 마커가 낱개로도 남아** 같은
          교회가 두 번 보인다.

          **묶음을 누르면 우리가 직접 확대한다** — 기본 확대(한 단계)는 꺼 둔다.
        */
        clusterer = new kakao.maps.MarkerClusterer({
          map,
          markers,
          minLevel: MIN_CLUSTER_LEVEL,
          // 끄면 묶음이 첫 마커 자리에 붙어 **실제 무리보다 한쪽으로 치우쳐 보인다**
          averageCenter: true,
          disableClickZoom: true,
        });

        kakao.maps.event.addListener(clusterer, "clusterclick", (cluster) => {
          // 누른 묶음을 손끝에 붙잡아 둔다 — anchor가 없으면 화면이 중심으로 튄다
          map.setLevel(
            Math.max(MAX_ZOOM_LEVEL, map.getLevel() - CLUSTER_ZOOM_STEP),
            { anchor: cluster.getCenter() },
          );
        });

        // 빈 곳을 누르면 닫는다 — **모바일에서 말풍선을 끄는 유일한 길이다**
        if (linkToDetail) {
          kakao.maps.event.addListener(map, "click", closeBubble);
        }

        /*
          **두 곳 이상이면 전부 보이도록 맞춘다.** `level`로는 몇 개가 어디에 있는지에
          따라 화면 밖으로 나가는 점이 생긴다. 한 곳일 때는 경계가 점 하나라
          `setBounds`가 최대 확대로 튀므로 쓰지 않는다.
        */
        if (points.length > 1) {
          const bounds = new kakao.maps.LatLngBounds();
          for (const point of points) {
            bounds.extend(new kakao.maps.LatLng(point.lat, point.lng));
          }
          map.setBounds(bounds);
        }

        setStatus("ready");
      })
      .catch(() => {
        if (alive) setStatus("failed");
      });

    return () => {
      alive = false;
      // 지도 인스턴스에는 파괴 API가 없다. 마커만 떼면 나머지는 컨테이너와 함께 사라진다.
      // 마커는 클러스터러가 들고 있으므로 `clear()` 하나로 전부 떨어진다
      clusterer?.clear();
      closeBubble();
    };
  }, [churches, level, interactive, linkToDetail, router]);

  /*
    ⚠️ **실패 문구를 한 가지로 쓴다.** 로더는 `no-key`와 `script-failed`를 구분하지만
    **화면에서는 구분할 수 없다** — 카카오는 등록되지 않은 도메인에 스크립트를 주지
    않아 도메인 미등록이 네트워크 실패와 같은 증상으로 온다(`load-kakao.ts` 주석).

    **경고색(`destructive`)을 쓰지 않는다.** 지도가 안 뜨는 것은 우리 쪽 사정이지
    그 교회의 문제가 아니다 — `ChurchNotice`가 같은 이유로 붉은 상자를 버렸다.
  */
  if (status === "failed") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg bg-muted",
          className,
        )}
      >
        <MapPin aria-hidden className="size-6 text-muted-foreground" />
        <p className="text-t4 text-muted-foreground">
          지도를 불러오지 못했습니다
        </p>
      </div>
    );
  }

  return (
    <div
      ref={container}
      /*
        **지도는 보조 수단이고 목록이 정본 경로다.** 스크린리더에 빈 상자를 읽히지
        않도록 감춘다 — 지도에만 있는 정보를 만들지 않는 것이 이 결정의 전제다.
      */
      aria-hidden
      className={cn(
        "rounded-lg bg-muted",
        // 로드 전에는 회색 자리만 보인다. 뜬 뒤에 배경이 비치지 않도록 덮는다
        status === "ready" && "bg-transparent",
        className,
      )}
    />
  );
}
