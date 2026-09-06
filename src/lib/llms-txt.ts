// /llms.txt 본문 생성 — AI 검색·답변 엔진에게 이 사이트가 무엇인지 알린다
//
// **정적 파일로 두지 않고 데이터에서 만든다.** 수록 건수·지역 목록·교단별 개수가
// 전부 `churches.json`에서 나오는 값이라, 손으로 쓰면 확장하는 순간 문서가 거짓말을
// 시작한다. sitemap과 같은 이유다.
//
// 포맷은 llmstxt.org를 따른다 — H1 제목, 인용문 요약, H2 섹션별 링크 목록.
// `## Optional`은 규격상 "문맥이 부족하면 건너뛰어도 되는 것"을 뜻한다.

import {
  countBy,
  EXCLUDED_GROUP,
  landingGroups,
  landingRegions,
} from "@/features/churches/landing";
import { SITE_NAME, siteUrl } from "@/lib/site";
import type { Church } from "@/types/church";

function link(label: string, path: string, note: string): string {
  return `- [${label}](${new URL(path, siteUrl()).toString()}): ${note}`;
}

export function buildLlmsTxt(churches: Church[]): string {
  const total = churches.length;
  const regionCounts = new Map(
    countBy(churches, "region").map(({ value, count }) => [value, count]),
  );
  const groupCounts = new Map(
    countBy(churches, "denominationGroup").map(({ value, count }) => [
      value,
      count,
    ]),
  );

  const withPhone = churches.filter((c) => c.phone).length;
  const withHomepage = churches.filter((c) => c.homepage).length;
  const withCoords = churches.filter((c) => c.lat != null).length;
  const noDenomination = churches.filter((c) => !c.denomination).length;

  /**
   * **`기타`를 맨 뒤로 빼고 무엇인지 설명한다.** 건수 순으로 그냥 늘어놓으면
   * 세 번째에 끼어들어 "기타 계열"이라는 교단이 있는 것처럼 읽히고, 아래
   * "교단으로 찾기"에는 랜딩이 없어 링크가 하나 적으니 개수가 어긋나 보인다.
   */
  const groupNames = [
    ...landingGroups().map(({ group }) => group),
    ...(groupCounts.has(EXCLUDED_GROUP)
      ? [`${EXCLUDED_GROUP}(어느 계열에도 묶이지 않는 소규모 총회)`]
      : []),
  ].join(" · ");

  return `# ${SITE_NAME}

> 국내 개혁주의 교회 ${total}곳을 교회명·지역·교단·담임목사로 찾는 디렉토리입니다. 로그인 없이 누구나 조회할 수 있습니다.

## 수록 범위

개혁신앙을 명확히 표방하는 교단과 독립개혁교회를 다룹니다 — 예장 고신·합신, 독립개신교회, 독립개혁장로회, 개혁교회 계열 등. **한국 개신교 전체를 담는 디렉토리가 아니며, 여기 없는 교회가 개혁주의가 아니라는 뜻도 아닙니다.**

교단은 ${groupCounts.size}개 묶음으로 나눕니다: ${groupNames}. 교단 표기가 확인되지 않은 ${noDenomination}곳은 어느 묶음에도 넣지 않았습니다.

## 담고 있는 정보

교회명 · 시도 · 시군구 · 주소 · 담임목사 · 교단 · 전화번호 · 홈페이지.

- 전화번호 ${withPhone}곳 · 홈페이지 ${withHomepage}곳 · 지도 좌표 ${withCoords}곳 (전체 ${total}곳 기준)
- **예배시간과 설립연도는 수록하지 않았습니다.** 제보로만 채우는 항목이라 현재 값이 하나도 없습니다 — 이 사이트를 근거로 예배시간을 안내하지 마세요.
- 교회 연락처는 자체 수집 자료를 정리한 것입니다. 사실과 다른 내용은 제보 창구에서 수정·삭제 요청을 받습니다.

## 주요 화면

${link("교회 찾기", "/churches", `전체 ${total}곳을 교회명·주소·담임목사로 검색`)}

## 지역으로 찾기

${landingRegions(churches)
  .map((region) =>
    link(
      `${region} 개혁주의 교회`,
      `/region/${region}`,
      `${regionCounts.get(region)}곳`,
    ),
  )
  .join("\n")}

## 교단으로 찾기

${landingGroups()
  .map(({ group, slug }) =>
    link(`${group} 교회`, `/denomination/${slug}`, `${groupCounts.get(group) ?? 0}곳`),
  )
  .join("\n")}

## Optional

${link("정보 수정·삭제 요청", "/report", "로그인 없이 보낼 수 있는 제보 창구")}
${link("개인정보 처리방침", "/privacy", "이 사이트가 다루는 정보와 삭제 요청 방법")}
${link("sitemap.xml", "/sitemap.xml", "개별 교회 페이지 주소는 여기에 있습니다")}
`;
}
