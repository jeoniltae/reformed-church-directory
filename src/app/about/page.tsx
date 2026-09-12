// 소개 화면 — 이 사이트를 만든 이유와 개혁주의 신앙의 배경을 설명한다
//
// ⚠️ **폴더명이 `about`인 것은 ASCII여야 하기 때문이다.** `/소개`로 만들면
// prerender 단계에서 `InvalidCharacterError`로 **빌드가 죽는다**(2026-09-05 실측,
// CLAUDE.md). Next의 세그먼트 캐시가 경로를 base64로 인코딩하는데 `btoa`는
// Latin-1만 받는다. **한글 파라미터 값은 멀쩡하다** — 정적 세그먼트만 ASCII로 둔다.
//
// **상단은 `/report`·`/privacy`와 같은 구성이다** — `SiteMark` + `h1`, 되돌아가기
// 줄 없음. 시안에는 뒤로가기 화살표가 있었으나 **`SiteMark`가 이미 홈으로 가는
// 링크라, 같은 곳으로 가는 링크가 둘이 된다.** 시안의 이어비로우
// (`REFORMED CHURCH DIRECTORY`)도 `SiteMark`가 하던 일이라 뺐다.
//
// **h1은 `소개`다.** 시안의 `흩어진 개혁주의 교회 정보를 한곳에`는 이름이 아니라
// 태그라인이라 리드 문장으로 내렸다. h1을 태그라인으로 두면 `metadata.title`·
// breadcrumb가 부르는 이름과 화면만 어긋난다 — `/churches`에서 겪고 h1을
// `교회 찾기`로 고친 것과 같은 문제다(2026-09-08).
//
// **본문은 상수 배열로 두고 반복문으로 그린다.** 절이 여섯이고 항목이 스물이 넘어
// JSX로 펼치면 문구를 고칠 때 마크업 사이를 헤매게 된다.

import { Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/shared/JsonLd";
import {
  NAV_FORWARD,
  PageTransition,
} from "@/components/shared/PageTransition";
import { SiteMark } from "@/components/shared/SiteMark";
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

/** 04 — 표준 문서 */
const STANDARDS = [
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
  {
    name: "세 일치 신조",
    meta: "Three Forms of Unity",
    body: "하이델베르크 요리문답, 벨직 신앙고백서, 도르트 신조를 함께 일컫는 표현으로, 대륙 개혁교회 전통의 세 표준문서를 가리킵니다.",
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
    <h2 className="flex items-baseline gap-2 text-t6 font-bold text-foreground">
      <span aria-hidden className="text-t4 font-semibold text-muted-foreground">
        {no}
      </span>
      {children}
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
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-8 pb-8">
        {/* 되돌아가기 줄이 없는 화면이라 제목 위에 한 줄로 둔다 (`/report`와 같다) */}
        <SiteMark className="mb-3" />
        <h1 className="text-t8 font-bold text-foreground">소개</h1>
        <p className="mt-1 text-t4 text-muted-foreground">
          흩어진 개혁주의 교회 정보를 한곳에 모았습니다.
        </p>

        {/* 01 ─ 만든 이유 */}
        <section className="mt-10">
          <SectionTitle no="01">이 사이트를 만든 이유</SectionTitle>
          <div className="mt-3 flex flex-col gap-3">
            {REASON.map((paragraph) => (
              <p key={paragraph.slice(0, 12)} className="text-t4 text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* 02 ─ 역사 */}
        <section className="mt-10">
          <SectionTitle no="02">개혁주의 신앙의 역사</SectionTitle>
          {/*
            **`<ol>`이다.** 시간 순서 자체가 내용이라 순서가 바뀌면 뜻이 달라진다.
            아래 용어·TULIP이 `<dl>`인 것과 갈리는 지점이다.
          */}
          <ol className="mt-4 flex flex-col gap-5 border-l border-border pl-4">
            {TIMELINE.map(({ year, title, body }) => (
              <li key={year}>
                <p className="text-t2 font-semibold text-muted-foreground">
                  {year}
                </p>
                <p className="mt-0.5 text-t5 font-semibold text-foreground">
                  {title}
                </p>
                <p className="mt-1 text-t4 text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>

          {/* 한국은 별도 블록 — 위 주석 참고 */}
          <div className="mt-6 rounded-lg border border-border p-4">
            <p className="text-t2 font-semibold text-muted-foreground">
              {KOREA.year}
            </p>
            <p className="mt-0.5 text-t5 font-semibold text-foreground">
              {KOREA.title}
            </p>
            <p className="mt-1 text-t4 text-muted-foreground">{KOREA.body}</p>
          </div>
        </section>

        {/* 03 ─ TULIP */}
        <section className="mt-10">
          <SectionTitle no="03">칼빈주의 5대 교리 (TULIP)</SectionTitle>
          <p className="mt-1 text-t4 text-muted-foreground">
            도르트 회의(1618~1619)에서 정립된 개혁주의 구원론의 다섯 기둥입니다.
          </p>
          <dl className="mt-4 flex flex-col gap-4">
            {TULIP.map(({ ko, en, body }) => (
              <div key={ko}>
                <dt className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-t5 font-semibold text-foreground">
                    {ko}
                  </span>
                  <span className="text-t2 text-muted-foreground">{en}</span>
                </dt>
                <dd className="mt-1 text-t4 text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 04 ─ 표준 문서 */}
        <section className="mt-10">
          <SectionTitle no="04">개혁주의 신앙의 표준 문서</SectionTitle>
          <p className="mt-1 text-t4 text-muted-foreground">
            역사적 개혁교회가 신앙과 교리의 표준으로 삼아온 대표적인 문서들입니다.
          </p>
          <dl className="mt-4 flex flex-col gap-4">
            {STANDARDS.map(({ name, meta, body }) => (
              <div key={name}>
                <dt className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-t5 font-semibold text-foreground">
                    {name}
                  </span>
                  <span className="text-t2 text-muted-foreground">{meta}</span>
                </dt>
                <dd className="mt-1 text-t4 text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
          {/*
            맺음 문단이 **두 전통을 구분한다.** 이 문단이 없으면 위 여섯 문서가
            "모든 개혁교회의 공통 문서"로 읽힐 수 있다 — `denominations.json`
            작업에서 실제로 갈린다는 것을 확인했다(웨스트민스터만 쓰는 교단과
            대륙 3형식을 함께 쓰는 교단).
          */}
          <p className="mt-5 rounded-lg bg-muted p-4 text-t4 text-foreground">
            웨스트민스터 표준문서(영미 장로교 전통)와 세 일치 신조(대륙 개혁교회
            전통)는 강조점에 다소 차이가 있으나, 두 전통 모두 성경의 절대적 권위와
            하나님의 주권적 은혜를 신앙의 근본으로 고백한다는 점에서 하나의 개혁주의
            신앙 유산을 이루고 있습니다.
          </p>
        </section>

        {/* 05 ─ 용어 정리 */}
        <section className="mt-10">
          <SectionTitle no="05">용어 정리</SectionTitle>
          <p className="mt-1 text-t4 text-muted-foreground">
            목록에서 자주 보이는 말들입니다.
          </p>
          {/* 교회 상세의 `교회 정보`와 같은 구조다 */}
          <dl className="mt-4 flex flex-col gap-3">
            {GLOSSARY.map(({ term, body }) => (
              <div
                key={term}
                className="flex gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="w-12 shrink-0 text-t4 font-semibold text-foreground">
                  {term}
                </dt>
                <dd className="text-t4 text-muted-foreground">{body}</dd>
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
        <section className="mt-12 rounded-lg bg-primary p-5 text-primary-foreground">
          <h2 className="flex items-baseline gap-2 text-t6 font-bold">
            <span aria-hidden className="text-t4 font-semibold text-primary-foreground/60">
              06
            </span>
            이 사이트가 하는 일
          </h2>
          <p className="mt-1 text-t4 text-primary-foreground/70">
            무엇을 하고, 무엇을 하지 않는지 밝힙니다.
          </p>

          <ul className="mt-5 flex flex-col gap-3">
            {DOES.map((line) => (
              <li key={line} className="flex gap-2.5">
                <Check
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-primary-foreground"
                />
                <span className="text-t4">{line}</span>
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
                <span className="text-t4 text-primary-foreground/70">
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
