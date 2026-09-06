# CLAUDE.md

## 프로젝트 개요

개혁주의 교회 디렉토리 사이트. 국내 개혁주의 교단(예장 고신·합신 등)의 교회 정보를 자체 보유 데이터와 크롤러로 모아, 교회명·주소·교단·담임목사·홈페이지·연락처·예배시간 기준으로 검색·조회할 수 있는 서비스를 제공한다.
UI는 모바일 우선 반응형 웹으로 제작한다.
팀 규모: 1인 개발.

데이터 수집(크롤러) 관련 사항은 "데이터 수집" 섹션에서 다룬다.

---

## 관련 문서

작업 전에 아래 문서를 반드시 확인하세요.

- 코딩 규칙 및 금지 사항: `docs/coding-guidelines.md`
- 작업 결정 기록: `docs/context-notes.md`
- 체크리스트 — 개발환경·데이터 수집: `docs/checklist.md`
- 체크리스트 — 앱 UI·지도·SEO·배포: `docs/ui-checklist.md`
- 보유 데이터 필드 조사 결과: `docs/field-inventory.md`

`coding-guidelines.md`를 제외한 `docs/` 문서는 git에서 제외된 로컬 문서다.

---

## 기술 스택

### 런타임

- Node.js 24 (크롤러 스크립트는 내장 `fetch` 사용 — 별도 HTTP 클라이언트 불필요)

### Frontend

- Framework: Next.js 16 (App Router)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS + shadcn/ui
- State: Zustand
- Testing: Vitest (유틸 함수 단위 테스트만), 컴포넌트/E2E 테스트 없음 (의도적 결정)

### 데이터 저장소

- **DB 없음.** 교회 데이터는 `data/churches.json` 하나에 담고 앱이 직접 읽는다(현재 89건, 고신·합신 확장 후 약 3천 건 예상). 이 규모에서는 DB가 필요 없고, 상세 페이지는 `generateStaticParams`로 89건 전부 SSG로 굽는다(구현 완료). 결정 배경은 `docs/context-notes.md` 참고.
- 데이터 생성·갱신은 크롤러(`scripts/`)가 오프라인 배치로만 수행하고, 결과 JSON을 커밋한다. 배포는 커밋에 따라 Vercel이 자동 처리한다.
- API Route 없음 — Server Component에서 JSON을 직접 읽는다.
- Supabase를 다시 검토할 조건(데이터 수만 건 초과, 재배포 없는 갱신, PostGIS·전문 검색 필요)은 `docs/context-notes.md`에 정리돼 있다.

#### 인증 (Auth)

- 로그인 기능 없음. 전체 공개 조회 사이트다.
- 앱 안에 DB 쓰기 경로가 없으므로 RLS·권한 정책도 없다.

#### 사용자 제보

- **확정: GitHub Issues로 받는다.** Server Action에서 Issues API로 이슈를 생성한다. **구현 완료 (2026-09-03, `/report`)** — 실제 제출로 확인했다.
- 관리자 화면을 따로 만들지 않는다. GitHub Issues가 검토 화면이고, 반영은 `data/churches.json` 수정 커밋으로 한다.
- 로그인 불필요. 스팸이 실제로 문제가 되면 그때 Turnstile을 붙인다.
- 환경변수 `GITHUB_TOKEN`, `GITHUB_REPO` 사용 (`.env.example` 참고).

---

## DevOps

- 소스 관리: GitHub
- 배포: Vercel (main 브랜치 push 시 자동 배포)
- 환경변수: Vercel Dashboard에서 관리
- 별도 CI/CD 파이프라인 없음
- GitHub Actions: 현재 사용하지 않음. 크롤링 정기 실행이 필요해지면 그때 도입한다 — **[미결정]**

---

## 주요 명령어

```bash
npm run dev    # 개발 서버
npm test       # Vitest 단위 테스트
npm run lint   # ESLint
npm run build  # 프로덕션 빌드
```

데이터 정비용 오프라인 스크립트. 앱 런타임과 무관하며 수동으로만 돌린다.

```bash
npm run check:homepages      # 홈페이지 생존 확인 → data/dead-links.json
npm run normalize:addresses  # 도로명주소 검색 API로 주소 진단 → data/geocode.json
npm run geocode:coords       # 좌표제공 API로 좌표 채움 → data/geocode.json
npm run import:source        # 위 결과를 모아 data/churches.json 생성
npm run icons:favicon        # src/app/icon.png → src/app/favicon.ico (16·32·48)
```

`icons:favicon`은 데이터와 무관하다. **로고(`src/app/icon.png`)를 바꿨을 때만 돌린다.** `icon.png`는 브라우저 탭·매니페스트·OG 이미지의 로고 마크에 모두 쓰이므로, 한 파일만 갈아끼우고 이 명령을 돌리면 전부 따라온다.

**순서가 있다.** `normalize:addresses` → `geocode:coords` → `import:source`. 앞의 둘은 `data/geocode.json`만 갱신하고 `churches.json`은 건드리지 않는다. **주소를 재조회하면 좌표도 무효가 되므로** `normalize:addresses`를 다시 돌렸으면 `geocode:coords`도 다시 돌린다. 둘 다 `.env.local`의 승인키가 필요하다(`JUSO_SEARCH_KEY`·`JUSO_COORD_KEY`, API별로 키가 다르다).

- `npm run crawl:kosin`은 `scripts/collect-kosin.ts`가 생기는 시점에 `node scripts/collect-kosin.ts`로 추가한다. Node 24가 `.ts`를 네이티브 실행하므로 tsx 같은 실행기가 필요 없다.

### 화면 확인 — 개발 서버와 프로덕션 서버를 구분한다

| | 반영 | 쓰는 때 |
|---|---|---|
| `npm run dev` | 저장 즉시 | UI 반복 작업 |
| `npm run build` → `npx next start` | 매번 재빌드 필요 | 프리페치·정적 HTML 확인 |

- **`next start`는 구워진 HTML을 그대로 내려준다.** 소스를 고쳐도 재빌드 없이는 안 바뀐다. "고쳤는데 화면이 그대로"의 첫 번째 원인이다.
- **`<Link>` 프리페치와 정적 HTML 내용은 프로덕션 빌드에서만 확인된다.** SEO 검증(교회명이 정적 HTML에 들어갔는지)은 `next start` 쪽을 봐야 한다.
- **폰에서 볼 때는 `npm run dev` + LAN IP를 쓴다.** `next.config.ts`의 `allowedDevOrigins`가 이를 허용한다 — 이게 없으면 HTML은 200인데 JS 청크가 403이라 **화면은 보이는데 아무 조작도 안 먹는다.** 개발 모드 전용 설정이라 배포에는 영향이 없다.
- **기기 에뮬레이션으로는 못 잡는 것이 있다.** 뷰포트·UA만 바뀌고 렌더링은 데스크톱 크롬이다. UA 스타일시트에 의존하는 것(`::-webkit-search-cancel-button` 등)은 실기기에서만 드러난다.

---

## 프로젝트 구조

```
├── src/
│   ├── app/               # Next.js App Router (페이지 & 레이아웃)
│   ├── components/
│   │   ├── ui/            # shadcn/ui 기본 컴포넌트 (button, input, badge, textarea)
│   │   └── shared/        # 프로젝트 공통 컴포넌트 (BottomTabBar, PageTransition)
│   ├── features/          # 기능별 모듈
│   │   ├── churches/      # 교회 검색·조회 — data.ts, search.ts, components/
│   │   └── reports/       # 교회 정보 제보 (폼, Server Action → GitHub Issues)
│   ├── lib/               # 유틸리티 (cn(), church-utils, json-ld)
│   └── types/             # 전역 TypeScript 타입
├── scripts/               # 데이터 정비 스크립트 — 오프라인 배치, 앱 런타임과 분리
│   ├── lib/               #   스크립트 공용 모듈
│   ├── lib/coords.mts     #   UTM-K → WGS84 변환 (proj4, devDependency)
│   ├── import-source.mts
│   ├── check-homepages.mts
│   ├── normalize-addresses.mts
│   ├── geocode-coords.mts
│   ├── make-favicon.mts   #   icon.png → favicon.ico (sharp, devDependency)
│   └── collect-kosin.ts   # [WIP] 고신 교회 데이터 수집
└── data/                  # 앱이 직접 읽는 유일한 데이터 소스
    ├── churches.json      #   커밋 대상 (89건)
    ├── address-fixes.json #   주소 수동 교정 표
    ├── dead-links.json    #   홈페이지 생존 확인 결과
    ├── denominations.json #   교단 표기 판정표 — 배지 19종·묶음 6종. 앱 번들에는 안 들어간다
    ├── geocode.json       #   지오코딩 중간 산출물
    ├── reports/           #   스크립트 점검 리포트
    ├── excluded.json      #   삭제 요청받은 교회 — import-source.mts가 항상 제외
    └── raw/               #   내려받은 원본(KML 등), git 제외
```

`src/components/ui/`는 shadcn/ui가 관리하는 영역이므로 직접 수정하지 않는다. `[WIP]` 표시된 항목은 아직 생성 전이다. `src/hooks/`는 아직 필요해진 적이 없어 만들지 않았다.

---

## 라우트 구조

| 경로 | 렌더링 | 내용 |
|---|---|---|
| `/` | Static | 랜딩 — 수록 현황 카드, 지역 타일 6칸, 교회 미리보기 5건 |
| `/churches` | Static | 검색·목록. `?region=`은 클라이언트에서 읽는다 (아래 "상태 관리") |
| `/churches/[id]` | SSG | 교회 상세 89건. `generateStaticParams`로 빌드 시점에 전량 생성 |
| `/region/[region]` | SSG | 지역 랜딩 7개(3곳 이상만). **임계값 미만 지역도 주소로 열리지만 미리 굽지도 sitemap에 넣지도 않는다** |
| `/denomination/[group]` | SSG | 교단 랜딩 5개(`기타` 제외). slug는 `고신·고려 계열` → `고신고려` |
| `/map` | Static | 준비 중 안내. 좌표·지도 SDK 확보 전까지 자리만 지킨다. **`noindex` + sitemap 제외** |
| `/report` | Static | 제보 폼. 상세에서 `?church=<id>`로 대상을 넘겨받는다 (클라이언트에서 읽는다) |
| `/privacy` | Static | 개인정보 처리방침. 공개에 따르는 의무이며 `/report`·홈 footer에서 링크한다 |

**⚠️ 라우트 폴더명에 한글을 쓰지 않는다.** `/지역/[region]`으로 만들었더니 prerender 단계에서 `InvalidCharacterError`로 빌드가 죽었다(2026-09-05 실측) — Next의 세그먼트 캐시가 경로를 base64로 인코딩하는데 `btoa`는 Latin-1만 받는다. **한글 파라미터 값은 멀쩡하다**(`/churches/언약교회-강동구`가 그렇게 동작한다). 그래서 정적 세그먼트만 ASCII로 두고, 검색에 실제로 쓰이는 지역명은 주소에 한글로 남겼다. **`/지역/`으로 되돌리지 않는다.**

**상단 헤더가 없다.** 전역 이동은 `src/components/shared/BottomTabBar.tsx`(홈·검색·지도)가 전담하고, `layout.tsx`는 탭바와 `pb-16` 여백만 얹는다. 사이트명은 화면에 노출되지 않고 `metadata.title.template`으로 문서 제목에만 남는다. **헤더를 다시 만들지 않는다** — 시안이 정한 구조다.

### 화면 전환 (View Transitions)

탭 이동에 방향 슬라이드가 걸린다. `next.config.ts`의 `experimental.viewTransition`으로 켜져 있고, 애니메이션은 `globals.css`에 있다. 건드릴 때 지켜야 할 다섯 가지.

- **`PageTransition`은 각 `page.tsx`가 감싼다. `layout.tsx`로 올리면 전환이 통째로 죽는다** — `enter`/`exit`는 래퍼가 마운트·언마운트될 때만 발동하는데 레이아웃의 래퍼는 계속 살아 있다.
- **탭바의 `vt-tab-bar` 클래스를 지우지 않는다.** 지우면 탭바가 내용과 함께 화면 밖으로 밀린다.
- **이전 화면에 페이드아웃을 걸지 않는다.** `::view-transition-old(.nav-*)`는 `display: none`이다. 60px 슬라이드로는 이전 화면이 화면 밖으로 못 나가서, 투명해지는 동안 계속 보인다 — 실기기에서 잔상으로 드러났다. `opacity`만 지우면 불투명한 채 남아 더 나빠진다.
- **방향 문자열을 직접 쓰지 않는다.** `PageTransition`의 `NAV_FORWARD`·`NAV_BACK` 상수를 쓴다. 오타가 나도 에러가 없고 애니메이션만 조용히 죽는다. **`transitionTypes`를 아예 안 붙여도 같은 증상이다** — `enter`/`exit`의 `default: "none"`으로 떨어져 타입 없는 이동과 똑같이 처리된다. 탭바 밖에서 새 `<Link>`를 추가할 때(제보·개인정보 처리방침 화면 진입 링크에서 실제로 빠뜨렸다, 2026-09-03) 빼먹기 쉽다.
- **속도 조절은 `--nav-slide-duration` 한 줄이다.** `animation` 단축 속성 안에서 `var()`로 쓰이므로 값이 사라지면 선언 전체가 무효가 되어 전환이 없어진다. 바꾼 뒤 `getAnimations()`로 실제 지속시간을 확인할 것.

미지원 브라우저에서는 전환 없이 정상 동작한다. 브라우저 뒤로가기·스와이프에는 방향이 실리지 않는다(Next 문서 명시).

---

## 상태 관리

- 로컬 상태: useState
- 전역 상태: Zustand (UI 상태만 — 모달, 토스트 등)
- 서버 상태: Next.js App Router 캐싱 (React Query/SWR 사용 안 함, 의도적 결정)
- URL 상태: Next.js 라우터 (searchParams)

**`/churches?region=`은 초기값 전용이다.** 홈의 지역 타일에서 넘어올 때만 읽고, 이후 칩 조작은 로컬 상태로만 관리한다 — URL과 양방향 동기화하지 않는다. 버그가 아니라 결정이다. 데이터에 없는 지역이 들어오면 `전체`로 되돌린다.

**이 값을 서버에서 읽지 않는다.** `searchParams`를 받으면 라우트가 Dynamic이 되어 탭 전환마다 서버 왕복이 생기고, `useSearchParams()`를 쓰면 Suspense 경계가 필요해져 교회 목록이 정적 HTML에서 빠진다(SEO 손실). 그래서 `ChurchDirectory`가 `useSyncExternalStore`로 URL을 외부 저장소처럼 읽는다 — 서버 스냅샷이 비어 있어 하이드레이션도 어긋나지 않는다. **여기를 `searchParams`로 되돌리지 않는다.**

---

## 코드 컨벤션

### 네이밍

- 컴포넌트 파일: PascalCase (예: `ChurchCard.tsx`)
- 일반 파일: kebab-case (예: `church-search-utils.ts`)
- 상수: UPPER_SNAKE_CASE

### 컴포넌트

- Named export 사용, default export 지양
- 한 파일당 하나의 주요 export
- 관련 타입은 같은 파일에 정의

### 스타일링

- Tailwind className 조합 시 `cn()` 유틸 사용
- 인라인 스타일 금지

디자인 토큰·타이포 스케일·안티패턴 규칙은 `docs/ui-checklist.md`의 "원칙"과 "3단계 검수"에 있다. 화면 작업 전에 그쪽을 본다.

**`@theme`에 타이포 단계를 추가하면 `src/lib/utils.ts`에도 등록한다.** tailwind-merge는 Tailwind 기본 스케일만 알아서, 등록하지 않은 `text-t*`를 폰트 크기가 아니라 **색상으로 오인한다.** 그러면 같은 `cn()` 안의 `text-primary-foreground` 같은 색 클래스를 조용히 지운다(실제로 지역 필터 선택 칩 글자가 검정으로 나왔다). `src/lib/utils.test.ts`가 이 동작을 고정한다.

### shadcn `base-nova` — Base UI 기반이다

설치된 컴포넌트는 Radix가 아니라 **Base UI** 기반이므로 인터넷의 고전 shadcn 스니펫이 그대로 통하지 않는다. 실제로 밟은 함정 둘.

- **`Button`에 `render={<Link/>}`를 넘기지 않는다.** `nativeButton`이 기본 `true`라 네이티브 `<button>`을 기대하고, 링크를 렌더하면 접근성 경고가 난다. 링크에는 `buttonVariants`를 쓴다.
- **`buttonVariants()`는 반드시 `cn()`으로 감싼다.** 직접 쓰면 tailwind-merge가 돌지 않아 base의 `border-transparent`가 variant의 `border-border`를 덮어 테두리가 사라진다.

---

## 아키텍처 패턴

### Vertical Slice Architecture

- 기능별로 `features/` 하위에 구성
- 각 기능은 컴포넌트, 훅, 데이터 조회 로직을 함께 관리 (쓰기가 필요한 기능은 Server Action 포함 — 예: `reports`)

### Server vs Client Components

- 기본: Server Component
- 인터랙션 필요 시만 `'use client'` 사용

---

## 데이터 수집 (크롤러) — 진행 중(WIP)

개혁주의 교회 디렉토리를 위한 교회 데이터를 크롤링으로 수집한다. 전체 구조가 확정되지 않았으므로 이 섹션은 잠정이며, 결정되는 대로 갱신한다.

### 성격

- 크롤러는 **오프라인 배치 작업**이다. 앱의 요청 처리 경로(Server Component 조회)나 빌드 경로에 넣지 않고 `scripts/`에서 수동/스케줄로 실행해 데이터를 생성한다.
- 크롤링 전용 의존성(`fast-xml-parser`, 추후 Playwright 등)은 **devDependency로만 둔다.** 앱 런타임 번들에 들어가면 안 되고, 앱은 완성된 결과물 `data/churches.json`만 소비한다.

### 수집 범위

- 지역: 대한민국 국내 교회
- 신학적 범위: 좁은 개혁주의 — 개혁신앙을 명확히 표방하는 교단·독립개혁교회 중심 (예장 고신, 예장 합신, 독립개신교회, 독립개혁장로회, 개혁교회 계열, 한국 내 OPC/PCA 계열). 합동·백석·대신 포함 여부는 미결정.

### 수집 필드

**필드 집합은 보유 개혁교회 약 100건이 정의한다.** 무엇을 모을지 먼저 정하고 소스를 찾는 순서가 아니라, 이미 확보한 데이터에 무엇이 들어 있는지가 기준이다. `Church` 타입도 여기서 나온다.

**원본은 `data/raw/추천교회.CSV` 9열이 전부다** (2026-08-06 실측, `docs/field-inventory.md`).

지역 · sub-지역 · 교회명 · 담임목사 · 교단 · 전화번호 · 주소 · 홈페이지 · 비고

`비고`는 자유서술 21건이라 파이프라인에서 폐기했다. 나머지 8열이 `Church` 타입의 뼈대다.

**이 문서가 한때 "보유 데이터에만 있는 항목(소속 노회·설립연도·자매관계·신조 채택 여부)"이라고 적어둔 것은 데이터를 열어보기 전의 가설이었고, 위 9열 실측으로 거짓임이 판명됐다.** 네 항목 모두 원본에 없다. 다시 이 오해를 반복하지 말 것.

확정 시 판단 기준.

- **보유 데이터에 있는 항목** → 기본 필드로 채택한다.
- **보유 데이터에 없는데 필요한 항목** → 아래 "없는 필드의 확보 방침"을 따른다.
- **좌표** → 원본에 없다. 도로명주소 API로 생성했고 68/89건 확보됐다.

#### 없는 필드의 확보 방침 (2026-08-17 확정)

시안에 있으나 데이터에 없는 네 항목이다. 조사·파일럿 결과는 `docs/context-notes.md`의 "2026-08-17 — 교회 상세 화면 디자인 반영"에 있다. **이 질문을 다시 조사하지 않는다.**

| 항목 | 방침 | 선행 조건 |
|---|---|---|
| **신앙고백** | **교단 → 신앙고백 매핑표로 유도한다.** 다만 아래 단서를 볼 것 | ~~교단 표기 정규화~~ **완료 (2026-09-01).** 교단 없는 6건은 여전히 비게 된다 |
| **예배시간** | **GitHub Issues 제보 창구로 받는다.** 크롤은 실질 상한이 30건(34%)이라 ROI가 맞지 않는다 — 홈페이지 57건 중 22건이 다음·네이버 카페(로그인 벽)이고, 자체 도메인 22건은 전부 다른 도메인이라 파서 일반화가 안 된다 | `src/features/reports` 구현 (미착수) |
| **설립연도** | 같음 — 제보 창구. 연혁은 대개 `bbs`/`board` 경로라 크롤 블랙리스트와 충돌한다 | 같음 |
| **규모(출석)** | **넣지 않는다.** 공개 출처가 사실상 없고, 소형·개척교회 중심 디렉토리에서 교인 수는 서열로 읽힌다 | — |

- **`worshipTimes?`는 타입에만 있고 실데이터는 0건이다.** 필드 선언을 데이터 존재로 착각하지 말 것.
- **웹 검색으로 채우지 않는다.** 파일럿 3건 수확 0건이고, 실패 유형이 셋 다 달랐다(동명 교회 식별 불가 / 값이 랜딩에 없음 / 링크 부패). 검색엔진 약관과 출처 표기 의무에도 걸린다.
- **신앙고백은 교회별 정보가 아니라 교단 정보다.** `신앙고백` 대신 `교단 신앙고백`처럼 교단에서 온 값임이 드러나는 레이블을 쓴다.
- **다만 "교단 매핑표로 유도한다"는 방침에 한계가 드러났다 (2026-09-01, 교단 판정 중 발견).** 이 디렉토리의 좁은 개혁주의 범위에서는 **웨스트민스터만 쓰는 교단과 대륙 개혁교회 3형식(하이델베르크·벨직·도르트)을 함께 쓰는 교단이 갈린다.** 후자가 5종 확인됐다(`국신`→개혁 · `대한예수교개혁회` · `독립개혁장로회` · `합동사당총신` · `합신개혁`→IRPC). 반면 `합동총회`는 청교도 계열로 3형식이 없다. **"고신·합신은 웨스트민스터"라는 단순 매핑으로는 이 구분이 나오지 않는다.**
- **교회가 직접 공표한 신앙고백이 더 강한 출처다.** 합정동교회·죽림교회·한결교회는 홈페이지에 채택 신조를 스스로 밝히고 있어 교단에서 유도한 값보다 근거가 강하다. 근거는 `data/denominations.json`의 각 행 `hint`에 있다.

### 소스 & 도구

착수 순서는 법적 위험도 기준으로 정했다. 근거는 `docs/context-notes.md`의 "소스별 법적 판단" 참조.

- **1단계 — 보유 개혁교회 약 100건.** 발견과 교단 판별이 이미 끝난 자체 보유 데이터. 법적 리스크가 없고, 독립개신교회·독립개혁장로회·개혁교회 자매그룹은 통합 디렉토리가 존재하지 않아 다른 데서 구할 수 없다. **`Church` 스키마를 이 100건으로 확정한다.**
- **2단계 — 개별 교회 홈페이지.** 예배시간·SNS는 여기서만 얻을 수 있다. 정적 사이트는 내장 `fetch` + 파서, JS 렌더링 사이트만 Playwright(예정). 아래 "개별 홈페이지 크롤 가드" 필수.
- **3단계 — 소규모 개혁교회 확장.** 자매교회 링크 페이지를 시드로 삼고, 필요하면 Kakao 로컬·Naver 검색 **공식 API**로 보조한다.
- **4단계 — 예장 고신 (총회 양해 후).** Google My Maps KML 일괄 다운로드(`mid=1rElpaz34C8gWiRkcJSLzSFGUacCSjUyB`), 약 2,118개 교회. `fetch` + `fast-xml-parser`로 파싱. 전량 다운로드는 데이터베이스제작자 권리에 걸리므로 **사무국 양해가 선행 조건이다.**
- **5단계 — 예장 합신 (총회 요청).** robots.txt 차단이 확인됐으므로 **크롤링하지 않는다.** 총회에 명단을 요청한다.
- 파싱·정규화 함수는 유틸 성격이므로 Vitest 단위 테스트 대상으로 적합 (기존 테스트 정책과 일관).

#### 주소 정규화·좌표

- **도로명주소 API(`juso.go.kr`, 행정안전부)를 우선한다.** 공공데이터라 저장·재배포 제약이 상업 API보다 느슨하다. V-World 지오코더(국토교통부)도 같은 성격이다.
- Kakao 로컬 API는 전화·영업상태 대조용 보조로만 쓴다. 공식 API 사용이 적법한 것은 **요청 행위**에 대한 이야기이고, 받은 결과를 `data/churches.json`에 저장해 public 저장소에 커밋·공개하는 것은 약관에서 따로 제한할 수 있다 — **[확인 필요]**
- 100건 규모에서는 완전 자동화가 ROI에 맞지 않는다. 스크립트가 후보를 제시하고 원본과 다른 항목만 사람이 확인하는 **반자동**으로 한다.

### 저장 (확정)

- `data/churches.json`으로 커밋해 앱이 직접 읽는다. DB는 쓰지 않는다.
- 내려받은 원본(KML 등)은 `data/raw/`에 두고 git에서 제외한다.
- `Church` 타입과 JSON 스키마는 아직 미확정 — **보유 100건**을 기준으로 정한다.

### 준수 사항

- 각 소스의 `robots.txt`·이용약관 확인. 합신 사이트는 자동 접근 차단이 확인됐으므로 크롤링하지 않고 총회에 데이터를 요청한다.
- 요청 간 지연(초당 1건 이하), User-Agent 명시. 같은 도메인에는 간격을 더 둔다 — 소규모 교회 홈페이지는 저렴한 호스팅이라 부하에 약하다.

#### 소스 선택 원칙

"홈페이지에 공개돼 있으니 크롤링해도 된다"는 등식은 성립하지 않는다. 공개는 사람이 브라우저로 열어보는 것을 허용한 것이지, 자동화로 전량 복제해 별도 서비스를 만드는 것까지 허락한 게 아니다. 상세한 근거는 `docs/context-notes.md` 참조.

- **제3자 상업 디렉토리(KCM 주소록, 교회114)는 사용하지 않는다.** 얻는 필드가 교회명·주소·전화뿐이라 교단 소스와 완전히 겹치는데, 데이터베이스제작자 권리와 성과 도용 리스크는 가장 크다. 특히 교회114는 직접 경쟁 서비스다.
- **교단 공식 소스는 사무국 양해를 먼저 구한다.** 이메일 한 통으로 DB권·약관·robots 문제가 전부 해소된다.
- **검색엔진을 직접 스크래핑하지 않는다.** Google·Naver 모두 약관에서 자동화 쿼리를 금지한다. 필요하면 공식 API를 쓴다.
- **출처 표기와 원본 링크는 법적 방어에도 작용한다.** 원본으로 트래픽을 보내는 구조라야 "대체재가 아니라 보완재"가 된다. 비영리 운영도 같은 맥락이며, 광고를 붙이면 판단이 달라질 수 있다.

#### 개별 홈페이지 크롤 가드

교단 디렉토리는 정제된 필드만 주지만 개별 교회 홈페이지는 무엇이 나올지 예측할 수 없다. **주보 PDF(성도 실명·헌금자 명단·심방 일정)와 중보기도 게시판(질병·가정사)이 가장 위험하다.** 건강 정보와 종교적 신념은 개인정보보호법상 민감정보라 처리 요건이 훨씬 엄격하다.

- **HTML만 요청한다.** PDF·HWP·DOC·이미지 첨부는 가져오지 않는다. 주보 사고의 대부분이 이걸로 막힌다.
- **URL 경로 블랙리스트** — `주보`·`bulletin`·`bbs`·`board`·`기도`·`pray`·`gallery`·`album`이 포함된 경로는 따라가지 않는다.
- **추출도 화이트리스트로** — 예배시간·SNS 링크·홈페이지 URL·담임목사명만 뽑고 나머지 텍스트는 버린다. 원문을 저장하지 않으면 저작권과 개인정보가 동시에 해결된다.
- **사람 사진은 일절 수집하지 않는다.** 초상권과 저작권이 함께 걸린다.
- "개수가 작으니 괜찮다"는 논리는 쓰지 않는다. 개인정보는 양과 무관하게 한 건이라도 문제가 된다.

#### 저작권 경계선

개별 홈페이지에서는 DB제작자 권리 대신 **진짜 저작권**이 문제가 된다.

- **안전** — 예배시간·주소·전화. 사실이므로 저작물이 아니다. 잠정 수집 필드는 전부 여기에 해당한다. 보유 데이터에 교회 소개문 같은 서술형 항목이 있다면 필드 확정 시 이 기준으로 걸러낸다.
- **위험** — 교회 소개문, 담임목사 인사말, 사진, 로고. 창작 표현이다.

"소개문을 한 줄 요약해서 카드에 넣자"거나 "썸네일 이미지가 있으면 좋겠다"는 생각이 드는 순간 저작권 문제가 시작된다. 그때 이 선을 다시 확인할 것.

#### 연락처 수집 기준

판단 기준은 **번호 형식이 아니라 게시 맥락**이다. 소스가 연락처 항목으로 명시한 번호는 교회가 "연락 주세요"라고 공개한 것이므로 형식(02/031/010)과 무관하게 수집한다. 개척교회·소형교회는 대표번호가 담임목사 휴대폰인 경우가 흔해서, 010을 형식으로 걸러내면 정작 노출이 절실한 교회만 연락처 없이 등록되는 역설이 생긴다.

- **수집한다** — 소스가 연락처 필드로 명시한 번호. 형식 무관.
- **수집하지 않는다** — 본문 텍스트를 정규식으로 스캔해 찾아낸 번호(목회자 소개 문단, 게시글, 첨부 파일 등). 원본 필드를 통째로 담지 말고 **파싱한 필드만 화이트리스트로 뽑아 쓰면** 이 구분이 자동으로 지켜진다.
- **이메일은 싣지 않는다** — `mailto:` 평문 노출은 스팸 수집 봇의 표적이 되고, 교회가 입은 피해의 원인으로 이 사이트가 지목될 수 있다. 대신 홈페이지/SNS 링크를 노출한다.
- 주민등록번호 형식 등 명백한 민감정보가 섞여 들어오면 커밋 전에 걸러낸다.

전화번호는 `tel:` 링크로 노출한다. 모바일 우선 UI에서 탭 한 번으로 전화가 걸리는 것이 이 서비스의 핵심 동선이다.

#### 공개에 따르는 의무

- **출처 표기** — 교회 상세 페이지에 수집 출처를 밝힌다 (예: "예장 고신 총회 교회 디렉토리에서 수집"). 이용자가 원본을 확인할 수 있고, 정보주체 입장에서도 출처가 명확해진다.
- **삭제 요청 창구** — 제보 폼에 정보 수정뿐 아니라 삭제 요청도 받는다고 명시한다.
- **`data/excluded.json`** — 삭제 요청받은 교회를 기록하고 크롤러가 항상 제외한다. 이 목록이 없으면 다음 크롤링에서 되살아난다.
- **git 이력은 되돌릴 수 없다.** `data/churches.json`에서 지워도 public 저장소 이력에는 남고, 포크·클론된 사본은 회수할 수 없다. 그래서 출구가 아니라 입구(크롤러 출력 통제)에서 막는다.

### 교단 표기 정규화 (2026-09-01 완료)

원본 21종을 판정해 **배지 19종 + 묶음 6종**으로 정리했다. 판정표는 `data/denominations.json`, 경위는 `docs/교단 표기 정규화.md`와 `docs/context-notes.md`에 있다.

- **필드가 둘이다.** `denomination`은 배지에 보이는 총회 이름, `denominationGroup`은 필터에 쓰는 묶음이다. **나눠 둔 덕에 별개 총회를 같은 묶음에 담을 수 있다** — `고려`는 1976년 고신에서 분리된 별개 총회지만 `고신·고려 계열`이다. 필드가 하나였다면 합치거나 쪼개거나였고 어느 쪽도 사실과 어긋났다.
- **묶음은 6종이다** — `합신 계열` 20 · `합동 계열` 17 · `고신·고려 계열` 16 · `기타` 16 · `대신 계열` 9 · `독립·해외` 5 (교단 없음 6건). Seed `which-input` 기준 7개 이하라 칩 필터로 쓸 수 있다.
- **묶음에 넣는 기준은 `data/denominations.json`의 `groupRule`이다.** ①X에서 갈라져 나온 것이 확인된 총회 ②`대한예수교장로회(X…)` 형식으로 스스로 X를 표방하는 총회. **이름에 X 글자가 들어간다는 것만으로는 넣지 않는다** — 이름으로 계열을 추정한 네 건이 전부 틀렸다.
- **`기타`는 판정 실패를 뜻하지 않는다.** 16건 중 9건은 교단이 확정된 소규모 독자 총회다.
- **매핑표는 앱 번들에 들어가지 않는다.** `scripts/lib/denominations.mts`가 오프라인에서만 읽고, 앱은 구워진 값만 소비한다.
- **표에 없는 표기는 조용히 비우지 않는다.** 원본을 그대로 두고 `import:source`가 경고한다 — 확장 때 교단이 사라진 것을 알아채기 위해서다.
- **한 raw 값이 서로 다른 교단을 가리키면 `perChurch`로 교회별로 나눈다** (`개혁`·`독립`·`합동진리` 세 행).

**남은 것** — `독립개혁장로회`와 `독립개혁장로교회(IRPC)`가 같은 조직인지 미확정이다(`data/denominations.json`의 `openQuestion`). 묶음은 이 답에 좌우되지 않는다.

### 미결정 사항

- `Church` 타입과 `data/churches.json` 스키마 (좌표·SNS 필드 포함 여부) — 보유 100건을 보고 정한다
- Kakao 로컬 API 결과의 저장·재배포 가능 여부 (약관 확인 필요)
- 갱신 주기 및 스케줄 자동화(GitHub Actions) 여부
- 합동·백석·대신 포함 여부

---

## SEO 운영 가이드

> **⚠️ 이 사이트는 공개돼 있다 (2026-09-06).** `https://www.refchurch.kr`에서 검색엔진이 수집 중이고 구글·네이버·Bing에 등록·사이트맵 제출까지 끝났다. **이제 URL을 바꾸면 색인된 주소가 깨진다** — 라우트 구조를 손대기 전에 리다이렉트를 함께 생각할 것.
>
> `src/app/robots.ts`는 `VERCEL_ENV === "production"`일 때만 열리고 로컬·프리뷰에서는 전면 차단이다(프리뷰 중복 색인 방지). **`dev` 브랜치 push로는 열리지 않는다.** 6-0 ~ 6-6이 끝났고 **남은 것은 측정(6-7)뿐**이다 — 목록은 `docs/ui-checklist.md`의 SEO 섹션에 있다.

### 현재 구현된 것

- `src/app/layout.tsx` — `metadataBase`, `title`(`default` + `template`), `description`, `openGraph`, `twitter`, `robots`, `verification`. 소유확인 토큰은 `src/lib/site.ts`의 `SEARCH_VERIFICATION`에 모여 있다 — **공개 값이라 환경변수로 감싸지 않고, 빈 값은 태그를 만들지 않는다.**
- 모든 화면에 `metadata`(title/description/canonical)가 있다. 홈은 `title`을 일부러 비워 layout의 `default`를 상속받는다 — 넣으면 template이 걸려 `홈 · 개혁주의 교회 디렉토리`가 된다.
- `/churches/[id]`·`/region/[region]`·`/denomination/[group]` — `generateMetadata`로 데이터 기반 title/description/canonical을 만든다.
- **OG 이미지는 코드로 굽는다.** `src/app/opengraph-image.tsx`(기본)와 `src/app/churches/[id]/opengraph-image.tsx`(89장). 껍데기·팔레트·로고는 `src/lib/og-layout.tsx`가 공유하고, 폰트 로딩은 `src/lib/og.ts`에 있다.
- `src/app/manifest.ts` · `icon.png` · `apple-icon.png` · `favicon.ico` — 아이콘은 전부 `icon.png` 하나에서 파생된다.
- `src/app/robots.ts` — 프로덕션에서만 개방, 그 외는 전면 차단. 위 경고 참고.
- `src/app/sitemap.ts` — 경로 목록은 `src/lib/indexable-paths.ts`가 만든다(105개). **`lastModified`·`priority`·`changeFrequency`를 넣지 않는다** — 넣을 만한 값이 없거나 무시되는 값이다.
- `src/lib/json-ld.ts` — `siteJsonLd()`(Organization+WebSite를 `@graph`로 묶어 `layout.tsx`에서 전역 삽입) · `breadcrumbJsonLd()` · `churchCollectionJsonLd()`(랜딩) · `churchJsonLd()`(상세). 문서에 심는 것은 `src/components/shared/JsonLd.tsx`가 전담한다.
- `src/app/not-found.tsx` — 없는 교회 id 접근 시. 상세의 `notFound()` 호출과 짝이다.

### 구현할 때의 방침

- **sitemap**: `src/app/sitemap.ts`가 `data/churches.json`을 읽어 자동 생성한다. 크롤러로 교회가 늘어도 별도 작업이 없어야 한다.
- **교회 상세**: `generateMetadata`가 교회명·지역으로 title/description/canonical을 만든다.
- **JSON-LD**: 데이터를 만드는 곳은 `src/lib/json-ld.ts`, 문서에 심는 곳은 `src/components/shared/JsonLd.tsx` 하나다. **`dangerouslySetInnerHTML`을 페이지에서 직접 쓰지 않는다** — `<` 이스케이프를 빠뜨린 곳이 생기면 데이터에 `</script>`가 섞였을 때 문서가 그 자리에서 깨진다.
- **JSON-LD의 URL은 절대 경로여야 하고 `new URL()`로 만든다.** canonical은 `metadataBase`가 절대화해 주지만 JSON-LD는 직접 만들어야 한다. **canonical과 같은 percent-encoding으로 나가야** 같은 페이지를 가리키는 두 주소가 생기지 않는다(이 사이트는 경로에 한글이 들어간다).
- **`SearchAction`을 넣지 않는다.** 사이트 내 검색이 클라이언트 전용이라 결과를 가리키는 URL이 없다 — 없는 기능을 있다고 신고하는 셈이 된다.
- **교회 상세 구조화 데이터는 `@type: "Church"`에 `geo`를 넣는다** (2026-08-12 결정, 구현 완료). schema.org에 `Place > CivicStructure > PlaceOfWorship > Church`로 실재하는 타입이다. **`LocalBusiness`를 쓰지 않는다** — 교회를 사업체로 표기하게 되어 사실과 어긋난다. `src/lib/json-ld.ts`의 `churchJsonLd()`.
- 좌표가 이 `geo` 때문에 필요해졌다. 그래서 좌표 확보가 지도(5단계)가 아니라 상세 페이지의 선행 조건이었다 — 나중에 넣으면 89개 정적 페이지를 다시 구워야 한다.
- **없는 값은 키 자체를 넣지 않는다.** 빈 문자열은 "값이 있는데 비어 있다"로 읽힌다. 좌표 없는 21건에는 `geo`가 없다.

### 새 페이지 추가 시 손대야 하는 곳

1. **새 정적 페이지** → 파일 상단에 `export const metadata: Metadata = { title, description, alternates }` 추가
2. **새 교단 데이터 추가** → sitemap이 `data/churches.json` 기반이므로 별도 작업 없음
3. **새 동적 라우트** → `generateMetadata` + 해당 JSON-LD 헬퍼
4. **새 핵심 정적 페이지(about/vision류)** → `breadcrumbJsonLd()`로 BreadcrumbList 적용

### 크롤러 정책 — 적용됨 (2026-09-06)

- **AI 크롤러를 명시적으로 allow한다** — GPTBot, ClaudeBot, PerplexityBot, Google-Extended. 학습용/검색용 구분 없이 전부 허용(최대 노출 우선, 2026-06-19 결정).
- **국내 검색엔진 크롤러도 명시한다** — `Yeti`(네이버)·`Daumoa`(다음). "교회 찾기"는 생활·지역 쿼리라 네이버 비중이 크고, 네이버는 크롤러 허용과 별개로 **서치어드바이저 소유확인·사이트맵 수동 제출**이 따로 필요하다.
- ⚠️ **robots.txt는 가장 구체적인 그룹 하나만 적용한다.** 위 크롤러들은 각자 그룹을 갖고 있어, `User-agent: *`에 `Disallow`를 추가해도 그 제한을 물려받지 않는다 — **`*`를 제한할 일이 생기면 이 목록도 함께 고쳐야 한다.**
- ⚠️ **`Daumoa`를 열어두는 것만으로는 다음 검색에 잡히지 않는다.** 다른 프로젝트에서 robots.txt 허용만으로 몇 달을 기다렸으나 노출되지 않은 것을 확인했다(2026-09-06). **`register.search.daum.net`에 검색등록을 따로 신청해야 한다** — 소유확인 없이 사람이 검토하는 폼이고 반영에 3~15일 걸린다. 다음에 등록하면 네이트에도 함께 나간다.
- **`/llms.txt`** — AI 검색·답변 엔진을 위한 사이트 개요(llmstxt.org 포맷). **개별 교회 URL은 나열하지 않는다** — 지역·교단 랜딩까지만 링크하고 개별 페이지는 sitemap이 맡는다.
  - **`public/`의 정적 파일이 아니라 `src/app/llms.txt/route.ts`다.** 수록 건수·지역 목록·교단별 개수가 전부 데이터에서 나오므로 손으로 쓰면 확장할 때 거짓말이 된다. 본문 생성은 `src/lib/llms-txt.ts`.
  - **없는 것을 밝히는 문서다.** 예배시간·설립연도가 0건이라는 사실과 수록 범위의 한계를 명시해, AI가 이 사이트를 근거로 없는 값을 안내하거나 여기 없는 교회를 부정하지 않게 한다.

### 접근 제한으로 사이트맵/llms.txt에서 제외할 경로

- 현재 없음. 로그인 기능이 없고 전체 공개 조회 사이트이므로 접근 제한 라우트가 존재하지 않는다.
- 추후 관리자 페이지(`/admin` 등)가 생기면 이 섹션에 추가하고 사이트맵·llms.txt에서 제외한다.
- **`/map`은 sitemap에서 제외하고 `index: false`를 준다** (2026-09-04 결정). 준비 중 안내만 있는 화면이라 검색 노출 가치가 없고, 내용 없는 페이지는 soft 404로 판정될 위험이 있다. 실제 지도가 붙는 7단계에서 이 결정을 뒤집는다.
- `/report`·`/privacy`는 sitemap에 넣는다. 검색 유입 가치는 낮지만 색인돼도 무해하고, 삭제 요청 창구가 검색으로 발견되는 편이 낫다.
