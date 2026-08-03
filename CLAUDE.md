# CLAUDE.md

## 프로젝트 개요

개혁주의 교회 디렉토리 사이트. 국내 개혁주의 교단(예장 고신·합신 등)의 교회 정보를 크롤러로 수집해, 교회명·주소·교단·담임목사·홈페이지·연락처·예배시간 기준으로 검색·조회할 수 있는 서비스를 제공한다.
UI는 모바일 우선 반응형 웹으로 제작한다.
팀 규모: 1인 개발.

데이터 수집(크롤러) 관련 사항은 "데이터 수집" 섹션에서 다룬다.

---

## 관련 문서

작업 전에 아래 문서를 반드시 확인하세요.

- 코딩 규칙 및 금지 사항: `docs/coding-guidelines.md`
- 작업 결정 기록: `docs/context-notes.md`
- 작업 체크리스트: `docs/checklist.md`

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

- **DB 없음.** 교회 데이터는 `data/churches.json` 하나에 담고 앱이 직접 읽는다. 약 3천 건 규모라 DB가 필요 없고, 상세 페이지는 `generateStaticParams`로 전부 SSG로 굽는다. 결정 배경은 `docs/context-notes.md` 참고.
- 데이터 생성·갱신은 크롤러(`scripts/`)가 오프라인 배치로만 수행하고, 결과 JSON을 커밋한다. 배포는 커밋에 따라 Vercel이 자동 처리한다.
- API Route 없음 — Server Component에서 JSON을 직접 읽는다.
- Supabase를 다시 검토할 조건(데이터 수만 건 초과, 재배포 없는 갱신, PostGIS·전문 검색 필요)은 `docs/context-notes.md`에 정리돼 있다.

#### 인증 (Auth)

- 로그인 기능 없음. 전체 공개 조회 사이트다.
- 앱 안에 DB 쓰기 경로가 없으므로 RLS·권한 정책도 없다.

#### 사용자 제보

- **확정: GitHub Issues로 받는다.** Server Action에서 Issues API로 이슈를 생성한다. [미구현]
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

- `npm test`에는 아직 `--passWithNoTests`가 붙어 있다. 첫 유틸 테스트가 생기면 제거한다.
- `npm run crawl:kosin`은 `scripts/collect-kosin.ts`가 생기는 시점에 `node scripts/collect-kosin.ts`로 추가한다. Node 24가 `.ts`를 네이티브 실행하므로 tsx 같은 실행기가 필요 없다.

---

## 프로젝트 구조

```
├── src/
│   ├── app/               # Next.js App Router (페이지 & 레이아웃)
│   ├── components/        # 공유 UI 컴포넌트
│   │   ├── ui/            # shadcn/ui 기본 컴포넌트
│   │   └── shared/        # 프로젝트 공통 컴포넌트
│   ├── features/          # 기능별 모듈
│   │   ├── churches/      # [WIP] 교회 검색·조회 (컴포넌트, 훅, 데이터 조회 함께 관리)
│   │   └── reports/       # [WIP] 교회 정보 제보 (폼, Server Action → GitHub Issues)
│   ├── lib/               # 유틸리티 (cn() 등)
│   ├── hooks/             # 커스텀 React Hooks
│   └── types/             # 전역 TypeScript 타입
├── scripts/               # [WIP] 크롤러 — 오프라인 배치 실행, 앱 런타임과 분리
│   └── collect-kosin.ts   #        고신 교회 데이터 수집
└── data/                  # [WIP] 크롤링 결과물 — 앱이 직접 읽는 유일한 데이터 소스
    ├── churches.json      #        커밋 대상
    ├── excluded.json      #        삭제 요청받은 교회 — 크롤러가 항상 제외
    └── raw/               #        내려받은 원본(KML 등), git 제외
```

`src/components/ui/`는 shadcn/ui가 관리하는 영역이므로 직접 수정하지 않는다. `[WIP]` 표시된 디렉토리는 아직 생성 전이다.

---

## 상태 관리

- 로컬 상태: useState
- 전역 상태: Zustand (UI 상태만 — 모달, 토스트 등)
- 서버 상태: Next.js App Router 캐싱 (React Query/SWR 사용 안 함, 의도적 결정)
- URL 상태: Next.js 라우터 (searchParams)

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

교회명 · 주소 · 교단/소속 · 담임목사 · 홈페이지/SNS · 연락처 · 예배시간
(디렉토리성 소스는 예배시간·SNS가 비어 있는 경우가 많아, 개별 교회 홈페이지 2차 수집으로 보강 예정)

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

- **안전** — 예배시간·주소·전화. 사실이므로 저작물이 아니다. 현재 수집 필드는 전부 여기에 해당한다.
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

### 미결정 사항

- `Church` 타입과 `data/churches.json` 스키마 (좌표·SNS 필드 포함 여부) — 보유 100건을 보고 정한다
- Kakao 로컬 API 결과의 저장·재배포 가능 여부 (약관 확인 필요)
- 갱신 주기 및 스케줄 자동화(GitHub Actions) 여부
- 합동·백석·대신 포함 여부
- 디렉토리 UI를 둘 위치 (예: `features/churches`)

---

## SEO 운영 가이드

### 자동 처리 (추가 작업 불필요)

- **교회 상세 페이지**: `generateMetadata`가 `data/churches.json`을 읽어 title/description/OG/canonical 생성
- **sitemap.xml**: `src/app/sitemap.ts`가 `data/churches.json`을 읽어 자동 생성 — 크롤러로 새로 추가된 교회도 자동 포함
- **JSON-LD (Organization·WebSite)**: `src/app/layout.tsx`에서 전역 적용
- **JSON-LD (BreadcrumbList)**: about/vision 등 핵심 정적 페이지에 적용
- **[미결정]** 교회 상세 페이지의 구조화 데이터 스키마(`LocalBusiness`/`Church`/`Place` 중 선택) — 확정되는 대로 `src/lib/json-ld.ts`에 헬퍼 추가

### 새 페이지/교단(교회 그룹) 추가 시에만 수동 작업 필요

1. **새 정적 페이지** (`page.tsx` 신규 생성) → 파일 상단에 `export const metadata: Metadata = { title, description, openGraph }` 추가
2. **새 교단 데이터 추가** (예: 합신 크롤러 결과 반영) → `src/app/sitemap.ts`가 `data/churches.json` 기반이므로 별도 작업 불필요. 정적 라우트를 교단별로 나눈다면 `STATIC_ROUTES`에 경로 추가
3. **새 동적 라우트** (`[id]/page.tsx` 신규 생성) → `generateMetadata` + 해당 JSON-LD 헬퍼 추가 (`src/lib/json-ld.ts`)
4. **새 핵심 정적 페이지(about/vision류)** → `src/lib/json-ld.ts`의 `breadcrumbJsonLd()`로 BreadcrumbList 적용

### AI 크롤러 정책

- `src/app/robots.ts`에 GPTBot, ClaudeBot, PerplexityBot, Google-Extended 등 주요 AI 크롤러를 명시적으로 allow — 학습용/검색용 구분 없이 전부 허용(최대 노출 우선, 2026-06-19 결정)
- `public/llms.txt` — AI 검색·답변 엔진을 위한 사이트 개요 및 핵심 섹션 링크(llmstxt.org 표준 포맷). 게시글 개별 URL은 나열하지 않음(sitemap.xml의 역할)

### 접근 제한으로 사이트맵/llms.txt에서 제외된 경로

- 현재 없음. 로그인 기능이 없고 전체 공개 조회 사이트이므로 접근 제한 라우트가 존재하지 않는다.
- 추후 관리자 페이지(`/admin` 등)가 생기면 이 섹션에 추가하고 사이트맵·llms.txt에서 제외한다.

### 관련 파일

- `src/app/sitemap.ts` — 사이트맵 (정적 + 동적 URL 자동 생성)
- `src/app/robots.ts` — 크롤러 허용/차단 규칙 (AI 크롤러 포함)
- `public/llms.txt` — AI 검색·답변 엔진용 사이트 개요
- `src/app/manifest.ts` — PWA 설정
- `src/lib/json-ld.ts` — JSON-LD 헬퍼 (`organizationJsonLd`, `websiteJsonLd`, `breadcrumbJsonLd`; 교회 상세용 헬퍼는 스키마 확정 후 추가 예정)
- `src/app/layout.tsx` — 전역 metadata (OG, Twitter, canonical, 구글/네이버 인증, Organization·WebSite JSON-LD)
