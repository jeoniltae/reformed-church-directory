// 소개 화면 — 이 사이트를 만든 이유와 개혁주의 신앙의 배경을 설명한다
//
// ⚠️ **폴더명이 `about`인 것은 ASCII여야 하기 때문이다.** `/소개`로 만들면
// prerender 단계에서 `InvalidCharacterError`로 **빌드가 죽는다**(2026-09-05 실측,
// CLAUDE.md). Next의 세그먼트 캐시가 경로를 base64로 인코딩하는데 `btoa`는
// Latin-1만 받는다. **한글 파라미터 값은 멀쩡하다** — 정적 세그먼트만 ASCII로 둔다.
//
// **상단은 되돌아가기 줄(`< 홈`) 하나다** (2026-09-12 확정). 처음에는
// `/report`·`/privacy`처럼 `SiteMark` + `h1`을 쌓았고, 다음에는 상세·랜딩처럼
// 되돌아가기 줄의 오른쪽에 `SiteMark`를 얹었다. **둘 다 버렸다** — 저 줄에서는
// 되돌아가기와 `SiteMark`가 모두 `/`로 가서 같은 곳으로 가는 링크가 둘이 된다
// (상세·랜딩은 되돌아가기가 `/churches`라 목적지가 갈린다). 자세한 근거는 아래
// `<main>` 안 주석에 있다.
//
// **h1은 `소개`다.** 시안의 `흩어진 개혁주의 교회 정보를 한곳에`는 이름이 아니라
// 태그라인이라 h1 아래 별도 층으로 내렸다. h1을 태그라인으로 두면 `metadata.title`·
// breadcrumb가 부르는 이름과 화면만 어긋난다 — `/churches`에서 겪고 h1을
// `교회 찾기`로 고친 것과 같은 문제다(2026-09-08). **이름은 h1이, 헤드라인 역할은
// 태그라인이 나눠 맡는다.**
//
// **본문은 상수 배열로 두고 반복문으로 그린다.** 절이 여섯이고 항목이 스물이 넘어
// JSX로 펼치면 문구를 고칠 때 마크업 사이를 헤매게 된다.

import { Check, ChevronLeft, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/shared/JsonLd";
import {
  NAV_BACK,
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { breadcrumbJsonLd } from "@/lib/json-ld";

export const metadata: Metadata = {
  title: "소개",
  description:
    "개혁주의 교회 디렉토리를 만든 이유와 개혁주의 신앙의 역사·표준 문서를 소개합니다.",
  alternates: { canonical: "/about" },
};

/** 01 — 사용자가 작성한 산문 그대로 */
const REASON = [
  "한국 땅에는 수많은 교회가 세워져 있습니다. 그러나 정작 성경적으로 건강한 교회를 찾고자 하는 이들에게, 그 많은 교회들 중 어디를 향해 발걸음을 옮겨야 할지는 여전히 막막한 질문으로 남아 있습니다.",
  "종교개혁자들이 목숨을 걸고 외쳤던 슬로건, “오직 성경으로(Sola Scriptura)” — 성경으로 돌아가자는 그 외침을, 저희는 지금 이 시대에 다시 한번 겸허히 되새겨야 한다고 생각합니다. 화려함이나 규모가 아니라, 하나님의 말씀 위에 굳게 서 있는가 하는 물음이 교회를 분별하는 참된 기준이 되어야 하기 때문입니다.",
  "기독교 역사를 찬찬히 되짚어 보면, 개혁주의 신앙은 종교개혁자들과 청교도들이 신앙의 순수성을 지키기 위해 지켜온 개신교의 정통이었습니다. 저희는 이 귀한 정통을 이어받아, 오늘도 묵묵히 성경 위에 신앙의 터를 세우고 있는 교회들을 한눈에 찾아볼 수 있는 시스템이 있었으면 좋겠다는 바람으로 이 자리를 마련하게 되었습니다.",
  "거창한 뜻을 품고 시작한 일은 아닙니다. 다만 성경적으로 건강한 교회를 간절히 찾고 있는 누군가에게, 이 작은 디렉토리가 작은 이정표가 되어드리고 싶은 마음, 그리고 그 길을 함께 걸어가며 섬기고 싶은 마음으로 정성껏 준비했습니다.",
];

/**
 * 02 — 연표.
 *
 * ⚠️ **도르트 항목에서 다섯 항목 나열을 뺐다.** 원고에는 `(전적 부패, 무조건적
 * 선택, …)`이 붙어 있었는데 **바로 다음 절이 TULIP 전용**이라 같은 말이 두 번
 * 나온다. 표준 문서 절에도 또 나오므로 세 번이 될 뻔했다.
 */
const TIMELINE = [
  {
    year: "1517",
    title: "루터의 95개조 반박문",
    body: "마르틴 루터가 비텐베르크 성문에 95개조 반박문을 게시하며 종교개혁의 불씨를 지폈습니다. “오직 성경, 오직 은혜, 오직 믿음”이라는 개혁주의 신앙의 근간이 여기서 시작되었습니다.",
  },
  {
    year: "1536",
    title: "칼빈의 『기독교강요』 초판 출간",
    body: "장 칼빈이 26세의 나이로 『기독교강요(Institutes of the Christian Religion)』 초판을 펴내며, 개혁주의 신학의 체계적 기초를 놓았습니다.",
  },
  {
    year: "1541",
    title: "칼빈의 제네바 사역",
    body: "칼빈이 제네바로 돌아와 교회 조직과 신앙교육 체계를 정비하며, 제네바는 이후 유럽 전역 개혁교회의 신학적 중심지가 되었습니다.",
  },
  {
    year: "1559",
    title: "『기독교강요』 최종판 및 제네바 아카데미 설립",
    body: "칼빈이 『기독교강요』를 최종 완성하고 제네바 아카데미를 세워, 유럽 각지에서 몰려온 신학생들을 배출하기 시작했습니다.",
  },
  {
    year: "1561",
    title: "벨직 신앙고백서",
    body: "귀도 드 브레가 작성한 벨직 신앙고백서는 오늘날까지 대륙 개혁교회의 핵심 신앙표준 중 하나로 자리하고 있습니다.",
  },
  {
    year: "1563",
    title: "하이델베르크 요리문답",
    body: "독일 팔츠 선제후의 요청으로 작성된 이 요리문답은 “나의 유일한 위로는 무엇인가”라는 질문으로 시작하며, 오늘날까지 가장 널리 쓰이는 개혁주의 교리교육 자료입니다.",
  },
  {
    year: "1618~1619",
    title: "도르트 회의 (Synod of Dort)",
    body: "알미니우스주의 논쟁을 정리하기 위해 소집된 이 회의에서 채택된 도르트 신조는, 이후 “TULIP”으로 요약되는 개혁주의 구원론의 표준이 되었습니다.",
  },
  {
    year: "1643~1649",
    title: "웨스트민스터 총회",
    body: "영국 내전 중 소집된 이 총회에서 웨스트민스터 신앙고백서와 대·소요리문답이 작성되었습니다. 영미 장로교 전통의 신학적 기초가 여기서 세워졌으며, 청교도 신앙의 정수가 응축된 문서로 평가받습니다.",
  },
  {
    year: "17세기",
    title: "청교도 운동",
    body: "영국과 스코틀랜드에서 일어난 청교도들은 교회의 순수성을 회복하고 삶 전체를 하나님 말씀에 복종시키고자 했습니다. 존 오웬, 리처드 백스터, 토마스 왓슨 등이 남긴 경건 서적들은 오늘날까지 개혁주의 신자들의 신앙 훈련서로 읽히고 있습니다.",
  },
  {
    year: "1929",
    title: "웨스트민스터 신학교 설립",
    body: "자유주의 신학의 확산에 맞서 그레샴 메이첸이 필라델피아에 웨스트민스터 신학교를 세우며, 정통 개혁주의 신학을 지켜내고자 했습니다.",
  },
];

/**
 * 연표의 마무리 — 한국.
 *
 * ⚠️ **본 연표에서 떼어 별도 블록으로 뒀다.** 원고 순서가 `1929 → 1884`라 위
 * `<ol>`에 그대로 넣으면 **시간이 거꾸로 흐르는 것처럼 읽힌다.** 떼어 두면 서양
 * 흐름과 나란한 별개 줄기로 읽혀 순서 문제가 사라진다.
 *
 * ⚠️ **`(현 장로회신학대학교의 뿌리)`를 뺐다.** 평양신학교의 계보는 장신대(통합)·
 * 총신대(합동)·고신대·한신대가 함께 주장한다. **하나만 지목하면 통합 계보를 택한
 * 것이 되는데, 통합은 이 사이트의 수록 범위 밖이고 핵심 독자는 고신·합신이다.**
 */
const KOREA = {
  year: "1884년 이후",
  title: "한국 개신교의 전래",
  body: "언더우드, 알렌 등 초기 선교사들을 통해 장로교 신앙이 한국에 전래되었고, 1901년 평양장로회신학교가 설립되며 개혁주의 신학 교육의 토대가 마련되었습니다. 이 학교는 이후 여러 장로교 신학교의 뿌리가 되었습니다.",
};

/** 03 — TULIP */
const TULIP = [
  {
    ko: "전적 부패",
    en: "Total Depravity",
    body: "인간은 타락으로 인해 존재의 모든 영역 — 지성, 의지, 감정 — 이 죄로 오염되어, 스스로의 힘으로는 결코 하나님께 나아갈 수 없습니다.",
  },
  {
    ko: "무조건적 선택",
    en: "Unconditional Election",
    body: "하나님께서는 인간의 어떤 공로나 예지된 행위와도 상관없이, 오직 그분의 주권적 은혜와 기쁘신 뜻에 따라 창세 전에 구원받을 자를 택하셨습니다.",
  },
  {
    ko: "제한 속죄",
    en: "Limited Atonement",
    body: "그리스도의 십자가 죽음은 모든 사람이 아니라, 하나님께서 택하신 백성들을 위해 실제로 그들의 죄를 속량하는 효력 있는 대속이었습니다.",
  },
  {
    ko: "불가항력적 은혜",
    en: "Irresistible Grace",
    body: "하나님께서 택하신 자를 부르실 때, 성령께서는 거부할 수 없는 능력으로 그 마음을 새롭게 하시어 반드시 그리스도께로 나아오게 하십니다.",
  },
  {
    ko: "성도의 견인",
    en: "Perseverance of the Saints",
    body: "참으로 거듭난 성도는 하나님의 은혜와 능력으로 끝까지 보호받아, 결코 완전히 그리고 최종적으로 믿음에서 떨어지지 않습니다.",
  },
];

/**
 * 04 — 표준 문서. **두 전통으로 묶는다** (2026-09-12 개편).
 *
 * ⚠️ **이건 미관이 아니라 이해의 문제였다.** 예전에는 여섯 항목이 평평하게 나열됐는데,
 * 맺음 문단은 이 문서들이 **웨스트민스터 표준문서(영미 장로교)와 세 일치 신조(대륙
 * 개혁교회)로 갈린다**고 말한다. 목록이 그 구조를 전혀 보여주지 않아 문단 혼자
 * 뒷수습을 하고 있었다. `denominations.json` 작업에서 이 구분이 실제로 교단을
 * 가른다는 것을 확인했으므로(웨스트민스터만 쓰는 교단 vs 대륙 3형식을 함께 쓰는 교단),
 * 화면이 먼저 말하는 편이 맞다.
 *
 * ⚠️ **`세 일치 신조`가 항목에서 묶음 이름으로 올라갔다.** 그것은 개별 문서가 아니라
 * **하이델베르크·벨직·도르트를 함께 부르는 이름**인데, 예전에는 그 셋과 나란히
 * 여섯 번째 항목으로 서 있어 넷째 문서처럼 보였다. 묶음 제목이 되면서 원래 뜻으로
 * 돌아왔고, 항목도 6 → 5로 줄었다.
 */
const STANDARD_GROUPS = [
  {
    group: "웨스트민스터 표준문서",
    tradition: "영미 장로교 전통",
    items: [
      {
        name: "웨스트민스터 신앙고백서",
        meta: "1646",
        body: "영국 웨스트민스터 총회에서 작성된 이 고백서는 성경론, 하나님론, 구원론, 교회론 등 신앙 전반을 33장에 걸쳐 체계적으로 정리한 문서로, 영미 장로교 전통의 핵심 표준문서입니다.",
      },
      {
        name: "웨스트민스터 대요리문답 / 소요리문답",
        meta: "1647",
        body: "신앙고백서의 내용을 문답 형식으로 풀어낸 교리교육서입니다. 특히 소요리문답은 “인간의 제일 되는 목적은 무엇인가? 하나님을 영화롭게 하고 영원토록 그를 즐거워하는 것이다”라는 첫 문답으로 널리 알려져 있으며, 오늘날까지 어린이와 새신자 교육에 널리 쓰입니다.",
      },
    ],
  },
  {
    group: "세 일치 신조",
    tradition: "대륙 개혁교회 전통 · Three Forms of Unity",
    items: [
      {
        name: "하이델베르크 요리문답",
        meta: "1563",
        body: "“나의 유일한 위로는 무엇인가”라는 질문으로 시작하는 이 요리문답은 죄와 은혜, 감사의 삶이라는 세 부분으로 구성되어 있으며, 대륙 개혁교회 전통에서 가장 널리 사랑받는 교리교육서입니다.",
      },
      {
        name: "벨직 신앙고백서",
        meta: "1561",
        body: "귀도 드 브레가 박해받던 네덜란드 개혁교회 성도들을 위해 작성한 신앙고백서로, 37개 조항을 통해 개혁주의 신앙의 핵심을 간결하게 진술합니다.",
      },
      {
        name: "도르트 신조",
        meta: "1618~1619",
        body: "알미니우스주의에 맞서 개혁주의 구원론을 다섯 가지 항목(TULIP)으로 정리한 신조로, 하나님의 절대 주권과 은혜의 확실성을 강조합니다.",
      },
    ],
  },
];

/**
 * 05 — 용어 정리.
 *
 * **화면에 실제로 보이는 말만 고른다.** 교단 배지는 총회 이름이고 필터 칩은 계열이다.
 * 시안에 있던 `표준 문서`는 위 04가 대신하므로 뺐다 — 이 절은 "목록 화면에서
 * 마주치는 말"을 푸는 곳이다.
 */
const GLOSSARY = [
  {
    term: "교단",
    body: "같은 신앙고백과 교회 정치 원리를 따르는 교회들의 연합체입니다.",
  },
  {
    term: "총회",
    body: "교단의 최고 의결 기구이며, 교단 자체를 가리키는 말로도 쓰입니다. 목록의 교단 배지는 대부분 총회 이름입니다.",
  },
  {
    term: "노회",
    body: "한 지역 교회들의 목사와 장로가 모여 결정하는 회의입니다. 개별 교회와 총회 사이 단계입니다.",
  },
  {
    term: "당회",
    body: "개별 교회의 목사와 장로로 구성된 치리 기구입니다.",
  },
  {
    term: "계열",
    body: "이 사이트가 교단 필터에 쓰는 묶음입니다. 갈라져 나온 총회이거나 스스로 그 이름을 표방하는 총회를 한 묶음으로 봅니다.",
  },
];

/**
 * 06 — 하는 일 / 하지 않는 일.
 *
 * ⚠️ **`DOESNT`의 2·3번은 `src/lib/llms-txt.ts`에서 그대로 가져왔다.** 사이트
 * 성격을 말하는 곳이 넷(`llms.txt`·`DataNotice`·`/privacy`·여기)이라 문구가
 * 갈라질 위험이 있어 공유한다. **예배시간이 채워지면 양쪽을 함께 고쳐야 한다.**
 *
 * `DOES`의 첫 줄이 `개혁신앙을 표방하는 교단`으로 시작하는 것은 의도다 —
 * 01의 "성경 위에 신앙의 터를 세우고 있는 교회들"과 아래 "평가하지 않습니다"가
 * 부딪치지 않으려면, **수록 기준이 교단 소속이지 개별 교회 심사가 아니라는 점**이
 * 문장에서 드러나야 한다.
 */
const DOES = [
  "개혁신앙을 표방하는 교단과 독립개혁교회의 위치·연락처·담임목사·교단을 한곳에 모읍니다.",
  "주소는 도로명주소 API로 정규화했고, 확인하지 못한 것은 그 교회 화면에 그대로 밝힙니다.",
  "범위에 맞는데 빠진 교회는 등록 요청으로 받아 반영합니다.",
];

const DOESNT = [
  "교회의 신앙과 사역을 평가하거나 순위를 매기지 않습니다.",
  "여기 없다고 해서 개혁주의가 아니라는 뜻이 아닙니다 — 한국 개신교 전체를 담는 디렉토리가 아닙니다.",
  "예배시간과 설립연도는 아직 없습니다 — 제보로만 채우는 항목이라 현재 값이 하나도 없습니다.",
];

/**
 * 절 제목. 번호는 장식이라 `aria-hidden`이다 — 스크린리더가 "공일"을 읽을 이유가
 * 없다. 지역 롤링·이모지·모노그램과 같은 처리다.
 */
function SectionTitle({ no, children }: { no: string; children: string }) {
  return (
    /*
      **제목 오른쪽 남는 폭을 룰이 채운다** (2026-09-12 추가). 절이 여섯인데 제목이
      전부 같은 길이의 굵은 글씨라 "장이 열린다"는 신호가 약했다 — 4000px짜리 문서에서
      가장 필요한 것이 그 신호다. `flex-1` + `h-px`라 **세로를 1px도 더 쓰지 않는다.**

      **`items-baseline`을 쓸 수 없어 `items-center`로 바꿨다.** baseline 정렬에서는
      글자가 없는 룰(`<span>`)에 기준선이 없어 자기 아래쪽이 기준선으로 잡히고, 룰이
      제목 밑으로 내려간다. 대신 번호에 `self-baseline`을 줘 예전 정렬을 지킨다.
    */
    <h2 className="flex items-center gap-2 text-t7 font-bold text-foreground">
      <span
        aria-hidden
        className="self-baseline text-t5 font-semibold text-muted-foreground"
      >
        {no}
      </span>
      {children}
      <span aria-hidden className="h-px flex-1 bg-border" />
    </h2>
  );
}

export default function AboutPage() {
  return (
    /*
      **`PageTransition`은 각 `page.tsx`가 감싼다.** `layout.tsx`로 올리면
      `enter`/`exit`가 마운트·언마운트에서만 발동하는데 레이아웃의 래퍼는 계속
      살아 있어 전환이 통째로 죽는다.
    */
    <PageTransition>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-8">
        {/*
          되돌아가기 줄 — `< 홈` 하나다.

          **`/report`·`/privacy`와 갈라지는 지점이다.** 저 둘은 어느 화면의 푸터에서든
          들어오는 막다른 화면이라 돌아갈 곳이 하나로 정해지지 않아 되돌아가기 줄이
          없다. **`/about`은 홈의 카드 하나가 유일한 진입점**이라 `홈`으로 확정된다.

          ⚠️ **오른쪽에 `SiteMark`를 두지 않는다** (2026-09-12 확정). 상세·지역·교단
          랜딩은 이 줄의 빈 오른쪽을 사이트 표시에 쓰지만, **저기는 되돌아가기가
          `/churches`로 가고 `SiteMark`는 `/`로 가서 목적지가 다르다.** 여기서는 둘 다
          `/`라 **같은 곳으로 가는 링크가 한 줄에 둘**이 된다. 되살리지 않는다.

          **사이트 표시는 아래 히어로의 이어비로우(`REFORMED CHURCH DIRECTORY`)가
          맡는다.** `/about`은 색인 대상이라 검색으로 바로 들어오는 사람이 있어서 그
          표시 자체는 필요하다 — 다만 그 일을 링크가 아닌 텍스트가 하면 중복이 안 생긴다.
        */}
        {/*
          홈은 첫 번째 탭이라 **어느 화면에서 가든 되돌아가는 이동이다** —
          `SiteMark`가 `NAV_BACK`을 쓰는 것과 같은 결론이다.
          이름은 탭바가 부르는 `홈` 그대로다(2026-09-08의 이름 일치 규칙).
        */}
        <Link
          href="/"
          transitionTypes={NAV_BACK}
          // 본문 글자를 한 단계씩 올릴 때 **이 줄은 t4로 남긴다** (2026-09-12).
          // 되돌아가기 줄은 본문이 아니라 크롬이고, 상세·지역·교단 랜딩의 같은 줄이
          // 전부 t4다 — 여기만 키우면 화면을 옮길 때 같은 줄의 크기가 달라진다
          className="-ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-2 text-t4 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeft aria-hidden className="size-4" />홈
        </Link>

        {/*
          히어로 3층 — `소개`(이름) · 태그라인(헤드라인) · 리드(누구에게 쓰는가).

          **h1은 여전히 `소개`다.** 시안은 태그라인을 h1으로 두지만, 그러면
          `metadata.title`·breadcrumb가 부르는 이름과 화면만 어긋난다 —
          `/churches`에서 실제로 겪고 h1을 `교회 찾기`로 고친 문제다(2026-09-08).
          **이름은 h1이 맡고, 헤드라인 역할은 바로 아래 태그라인이 맡는다.**

          **이어비로우(`REFORMED CHURCH DIRECTORY`)가 사이트 표시를 맡는다.** 처음에는
          뺐었다 — 바로 위 `SiteMark`가 같은 이름을 말하고 있어 한글·영문이 12px 간격으로
          쌓였기 때문이다. **그 `SiteMark`를 뺀 뒤로는 이 화면에 사이트명이 한 글자도
          나오지 않았고**, `/about`은 `indexable-paths`·sitemap에 올라간 색인 대상이라
          검색으로 바로 들어오는 사람이 있다. 그 자리를 이어비로우가 메운다.

          표기는 홈 락업과 같다 — `text-t4` + `tracking-lockup`(0.14em) + `muted`.
          **자간을 임의값으로 쓰지 않는다**(`globals.css`의 토큰이다, 하드코딩 금지).

          ⚠️ **홈 락업과 달리 `aria-hidden`을 붙이지 않는다.** 홈에서 영문을 감춘 것은
          **바로 옆에 한글 사이트명이 있어 같은 이름을 연달아 두 번 읽게 되기 때문**인데,
          여기는 그 한글 표기가 없다. 감추면 스크린리더 사용자에게는 사이트 표시가
          통째로 사라져, 이 줄을 넣은 목적 자체가 없어진다.

          **링크로 만들지 않는다.** 바로 위 `< 홈`이 이미 `/`로 가는 링크다 — 그
          중복을 없애려고 `SiteMark`를 뺀 것이라, 여기를 링크로 만들면 제자리걸음이 된다.

          **리드 문장을 시안 것으로 바꿨다 (2026-09-12).** 예전 문장
          (`흩어진 개혁주의 교회 정보를 한곳에 모았습니다.`)은 **바로 위 h1을 말만
          바꿔 되풀이해 정보량이 0이었다.** 지금 문장은 읽는 사람을 구체적으로 지목한다
          (`낯선 도시에 도착한 성도`) — 홈 카드 부제를 `개혁주의란 무엇인지부터`로
          잡은 것과 같은 판단이다.

          **타이포는 기존 단계만 쓴다** — t8·t6·t4. 새 단계를 만들면 `src/lib/utils.ts`에
          등록해야 하고(빠뜨리면 tailwind-merge가 색으로 오인한다), `/report`·`/privacy`·
          상세·랜딩이 전부 t8이라 소개만 키우면 화면 간 위계가 깨진다.
        */}
        <p className="mt-3 text-t4 font-medium tracking-lockup text-muted-foreground">
          REFORMED CHURCH DIRECTORY
        </p>
        <h1 className="mt-2 text-t9 font-bold text-foreground">소개</h1>
        <p className="mt-2 text-t7 font-semibold text-foreground">
          흩어진 개혁주의 교회 정보를 한곳에
        </p>
        <p className="mt-2 text-t5 text-muted-foreground">
          낯선 도시에 도착한 성도가 가장 먼저 묻는 질문에, 흩어져 있던 자료를 모아
          답합니다.
        </p>

        {/* 01 ─ 만든 이유 */}
        <section className="reveal mt-10">
          <SectionTitle no="01">이 사이트를 만든 이유</SectionTitle>

          {/*
            인용 블록 — 이 사이트의 논지를 산문 앞에 세운다 (2026-09-12 추가).

            **문구는 아래 둘째 문단에 이미 있는 것이다.** 새로 쓴 말이 아니라 산문
            속에 묻혀 있던 핵심을 꺼낸 것이라, "하지 않은 말을 적지 않는다"는 이 문서의
            규칙과 어긋나지 않는다.

            **왼쪽 룰에만 청록을 쓴다.** 홈 제목의 지역 롤링·홈 카드 아이콘과 같은
            어휘다 — 세 곳 모두 "여기가 이 화면의 핵심"을 가리킨다. 글자에까지 색을
            주지 않는 것은 인용문이 길어 읽는 글이기 때문이다(대비는 확보되지만
            긴 문장을 유채색으로 읽히게 할 이유가 없다).

            **`<blockquote>`이다.** 출처가 이 문서 밖(종교개혁자들의 슬로건)이라
            의미상 맞고, 스크린리더에도 인용으로 전달된다.
          */}
          <blockquote className="mt-4 border-l-2 border-brand-accent py-1 pl-4">
            <p className="text-t7 font-semibold text-foreground">
              오직 성경으로
            </p>
            <p
              aria-hidden
              className="mt-1 text-t5 tracking-lockup text-brand-accent"
            >
              SOLA SCRIPTURA
            </p>
          </blockquote>

          <div className="mt-5 flex flex-col gap-3">
            {REASON.map((paragraph) => (
              <p key={paragraph.slice(0, 12)} className="text-t5 text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* 02 ─ 역사 */}
        <section className="reveal mt-10">
          <SectionTitle no="02">개혁주의 신앙의 역사</SectionTitle>
          {/*
            **`<ol>`이다.** 시간 순서 자체가 내용이라 순서가 바뀌면 뜻이 달라진다.
            아래 용어·TULIP이 `<dl>`인 것과 갈리는 지점이다.
          */}
          {/*
            **연표가 연표로 보이게 한다** (2026-09-12 개편). 예전에는 1px 왼쪽 선만
            있고 마디 표시가 없어 그냥 들여쓴 목록으로 읽혔다. 항목이 열한 개라
            이 절이 페이지에서 가장 긴 구간인데 축이 보이지 않았다.

            ⚠️ **연도가 화면에서 가장 작은 글씨였다**(`text-t4`, 12px). 열한 항목을
            조직하는 축인데 위계가 뒤집혀 있었다. t5로 올려 제목과 나란히 뒀다.

            **`tabular-nums`를 준다.** `1517`·`1618~1619`·`17세기`가 섞여 있어
            비례 숫자로 두면 자릿수가 흔들려 축이 들쭉날쭉해 보인다.
          */}
          <ol className="mt-4 flex flex-col gap-6 border-l border-border">
            {TIMELINE.map(({ year, title, body }) => (
              /*
                `relative` + 음수 왼쪽 오프셋으로 점을 레일 위에 얹는다.
                점 크기 8px(`size-2`)에 레일이 1px이라 `-left-1`(4px)이면 중앙에 온다.
                **배경을 `bg-background`로 채운 테두리 원이라** 레일이 점을 관통하지 않는다.
              */
              <li key={year} className="relative pl-5">
                <span
                  aria-hidden
                  className="absolute -left-1 top-1.5 size-2 rounded-full border-2 border-brand-accent bg-background"
                />
                <p className="text-t6 font-semibold tabular-nums text-brand-accent">
                  {year}
                </p>
                <p className="mt-1 text-t6 font-semibold text-foreground">
                  {title}
                </p>
                <p className="mt-1 text-t5 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>

          {/* 한국은 별도 블록 — 위 주석 참고 */}
          <div className="mt-6 rounded-lg border border-border p-4">
            <p className="text-t4 font-semibold text-muted-foreground">
              {KOREA.year}
            </p>
            <p className="mt-0.5 text-t6 font-semibold text-foreground">
              {KOREA.title}
            </p>
            <p className="mt-1 text-t5 text-muted-foreground">{KOREA.body}</p>
          </div>
        </section>

        {/* 03 ─ TULIP */}
        <section className="reveal mt-10">
          <SectionTitle no="03">칼빈주의 5대 교리 (TULIP)</SectionTitle>
          <p className="mt-1 text-t5 text-muted-foreground">
            도르트 회의(1618~1619)에서 정립된 개혁주의 구원론의 다섯 기둥입니다.
          </p>
          {/*
            **머리글자를 꺼낸다** (2026-09-12 추가). TULIP은 그 자체가 두문자어인데
            예전 화면에서는 acronym이 한 글자도 보이지 않았다 — `전적 부패 ·
            Total Depravity`가 다섯 번 나열될 뿐이라, 왜 이 절 제목이 TULIP인지
            화면만 보고는 알 수 없었다.

            **글자는 `en[0]`에서 나온다.** 손으로 적지 않는다 — 항목을 고치면 글자도
            따라오고, 순서가 바뀌면 acronym이 깨진 것이 화면에 바로 드러난다.
            (현재 T·U·L·I·P 순으로 정확히 맞는다.)

            **원형 타일은 `ChurchRow`·홈 소개 카드와 같은 어휘다**(`size-9`
            `rounded-full`). 새 모양을 만들지 않았다. 색은 `--primary`를 옅게 깐
            네이비 — 연표의 청록과 갈라놔야 두 절이 구분된다.

            **`aria-hidden`이다.** 스크린리더가 항목마다 "티", "유"를 읽을 이유가
            없다 — 바로 뒤 영문 이름에 그 글자가 이미 들어 있다. 절 제목도
            `칼빈주의 5대 교리 (TULIP)`이라 약어는 이미 전달된다.
          */}
          <dl className="mt-4 flex flex-col gap-4">
            {TULIP.map(({ ko, en, body }) => (
              <div key={ko} className="flex gap-3">
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-t7 font-bold text-primary"
                >
                  {en[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <dt className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-t6 font-semibold text-foreground">
                      {ko}
                    </span>
                    <span className="text-t4 text-muted-foreground">{en}</span>
                  </dt>
                  <dd className="mt-1 text-t5 text-muted-foreground">{body}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* 04 ─ 표준 문서 */}
        <section className="reveal mt-10">
          <SectionTitle no="04">개혁주의 신앙의 표준 문서</SectionTitle>
          <p className="mt-1 text-t5 text-muted-foreground">
            역사적 개혁교회가 신앙과 교리의 표준으로 삼아온 대표적인 문서들입니다.
          </p>
          {/*
            **두 전통을 묶음으로 보여준다** (2026-09-12 개편). 경위는 위
            `STANDARD_GROUPS` 주석에 있다. 묶음 제목이 왼쪽 룰을 달고 서고, 그 아래
            문서들이 들여쓰기로 딸린다 — **연표의 레일과 같은 어휘**라 새 모양이 없다.

            **묶음 제목은 `<h3>`이다.** 절(`<h2>`) 아래 단계라 문서 개요에서도
            두 전통이 갈려 보인다. 시각적 위계와 문서 구조를 따로 놀게 두지 않는다.
          */}
          <div className="mt-5 flex flex-col gap-6">
            {STANDARD_GROUPS.map(({ group, tradition, items }) => (
              <div key={group}>
                <h3 className="border-l-2 border-primary pl-3">
                  <span className="block text-t6 font-bold text-foreground">
                    {group}
                  </span>
                  <span className="mt-0.5 block text-t4 text-muted-foreground">
                    {tradition}
                  </span>
                </h3>
                <dl className="mt-3 flex flex-col gap-4 pl-3">
                  {items.map(({ name, meta, body }) => (
                    <div key={name}>
                      <dt className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-t6 font-semibold text-foreground">
                          {name}
                        </span>
                        <span className="text-t4 tabular-nums text-muted-foreground">
                          {meta}
                        </span>
                      </dt>
                      <dd className="mt-1 text-t5 text-muted-foreground">
                        {body}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          {/*
            맺음 문단은 **두 전통이 하나의 유산이라는 점**을 말한다. 예전에는 이
            문단이 혼자 구분까지 떠맡았는데(목록이 여섯 개 평면이었다), 이제 구분은
            위 묶음이 하고 이 문단은 **다시 묶는 일**만 한다 — 원래 역할로 돌아왔다.
          */}
          <p className="mt-5 rounded-lg bg-muted p-4 text-t5 text-foreground">
            웨스트민스터 표준문서(영미 장로교 전통)와 세 일치 신조(대륙 개혁교회
            전통)는 강조점에 다소 차이가 있으나, 두 전통 모두 성경의 절대적 권위와
            하나님의 주권적 은혜를 신앙의 근본으로 고백한다는 점에서 하나의 개혁주의
            신앙 유산을 이루고 있습니다.
          </p>
        </section>

        {/* 05 ─ 용어 정리 */}
        <section className="reveal mt-10">
          <SectionTitle no="05">용어 정리</SectionTitle>
          <p className="mt-1 text-t5 text-muted-foreground">
            목록에서 자주 보이는 말들입니다.
          </p>
          {/* 교회 상세의 `교회 정보`와 같은 구조다 */}
          <dl className="mt-4 flex flex-col gap-3">
            {GLOSSARY.map(({ term, body }) => (
              <div
                key={term}
                className="flex gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="w-12 shrink-0 text-t5 font-semibold text-foreground">
                  {term}
                </dt>
                <dd className="text-t5 text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/*
          06 ─ 하는 일 / 하지 않는 일.

          **이 화면의 유일한 다크 블록이다.** 시안은 히어로도 다크였으나, 현재
          `bg-primary` 면은 홈의 수록 현황 카드 하나뿐이고 **그 카드의 역할이
          "설명 + 행동 유도"다.** 여기가 같은 역할이므로 어휘가 이어진다 —
          둘 다 다크로 두면 그 의미가 흐려진다.
        */}
        <section className="reveal mt-12 rounded-lg bg-primary p-5 text-primary-foreground">
          <h2 className="flex items-baseline gap-2 text-t7 font-bold">
            <span aria-hidden className="text-t5 font-semibold text-primary-foreground/60">
              06
            </span>
            이 사이트가 하는 일
          </h2>
          <p className="mt-1 text-t5 text-primary-foreground/70">
            무엇을 하고, 무엇을 하지 않는지 밝힙니다.
          </p>

          <ul className="mt-5 flex flex-col gap-3">
            {DOES.map((line) => (
              <li key={line} className="flex gap-2.5">
                <Check
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-primary-foreground"
                />
                <span className="text-t5">{line}</span>
              </li>
            ))}
          </ul>

          <ul className="mt-4 flex flex-col gap-3 border-t border-primary-foreground/20 pt-4">
            {DOESNT.map((line) => (
              <li key={line} className="flex gap-2.5">
                <X
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-primary-foreground/60"
                />
                <span className="text-t5 text-primary-foreground/70">
                  {line}
                </span>
              </li>
            ))}
          </ul>

          {/*
            버튼 둘. **`buttonVariants`를 쓰지 않는다** — 그 토큰들은 밝은 배경을
            전제해서 `bg-primary` 위에 올리면 대비가 무너진다. `--primary` 위에는
            `--primary-foreground`만 올린다는 규칙 안에서 직접 조합했다.
            높이는 상세의 길찾기·전화 쌍과 같은 `h-12`다.
          */}
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link
              href="/report"
              transitionTypes={NAV_FORWARD}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary-foreground/10 text-t5 font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary-foreground/20 focus-visible:ring-3 focus-visible:ring-primary-foreground/40"
            >
              정보 제보
            </Link>
            <Link
              href="/churches"
              transitionTypes={NAV_FORWARD}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary-foreground text-t5 font-semibold text-primary outline-none transition-colors hover:bg-primary-foreground/90 focus-visible:ring-3 focus-visible:ring-primary-foreground/40"
            >
              교회 둘러보기
            </Link>
          </div>
        </section>

        {/*
          이동 경로를 검색엔진에 알린다. CLAUDE.md가 **`about/vision`류 핵심 정적
          페이지를 이 헬퍼의 대상으로 명시**하고 있다.

          **두 칸뿐이다** — 홈 아래 바로 붙는 화면이라 중간 단계가 없다.
          상세(홈 → 교회 찾기 → 지역 → 교회)와 달리 계층이 얕다.
        */}
        <JsonLd
          data={breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "소개", path: "/about" },
          ])}
        />
      </main>
    </PageTransition>
  );
}
