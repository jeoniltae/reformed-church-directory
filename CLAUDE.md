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

### Backend

- Supabase (PostgreSQL) — 크롤러가 수집한 교회 데이터 저장 + 사용자 제보 저장용 DB로 사용
- ORM 없음 — Supabase JS 클라이언트 직접 사용
- API Route 없음 — Server Component에서 직접 조회. 제보 등록은 Server Action으로 처리(예정)

#### 인증 (Auth)

- 일반 조회에는 로그인 불필요. 전체 공개 조회 사이트이며, 교회 데이터 자체는 크롤러(`scripts/`)로만 생성·갱신한다.
- **확정: 사용자 제보(교회 정보 오탈자·변경사항 신고) 기능 추가 예정.** 제보 작성 자체에 로그인이 필요한지(스팸 방지용)는 **[미결정]** — 로그인 없이 폼만 열어둘지, 최소한의 인증(예: 이메일 Magic Link)을 둘지 정해야 함.
- 제보 검토·반영을 위한 관리자 화면이 필요할 수 있음 — **[미결정]**

#### 접근 제어 (RLS 정책)

- 교회 데이터 읽기: 비로그인 포함 누구나 허용
- 교회 데이터 쓰기/수정/삭제: 클라이언트에서 불가. 크롤러가 `service_role` 키로만 수행
- 제보(`reports` 테이블, 가칭) 쓰기: 공개 허용 예정(구체적 정책은 인증 방식 확정 후 결정) — insert만 허용, select/update/delete는 관리자(service_role)만
- 제보 읽기: 일반 사용자 불가(본인이 쓴 것도 다시 조회할 필요 없음), 관리자만

---

## DevOps

- 소스 관리: GitHub
- 배포: Vercel (main 브랜치 push 시 자동 배포)
- 환경변수: Vercel Dashboard에서 관리
- 별도 CI/CD 파이프라인 없음
- GitHub Actions: Supabase keep-alive 용도로만 사용 (7일 비활성 시 일시 중지 방지)

---

## 주요 명령어

```bash
npm run dev        # 개발 서버
npm test           # Vitest 단위 테스트
npm run build      # 프로덕션 빌드
npm run db:types    # Supabase DB → TypeScript 타입 자동 생성
npm run crawl:kosin # [WIP] 고신 교회 데이터 수집 (scripts/collect-kosin.ts)
```

---

## 프로젝트 구조

```
├── src/
│   ├── app/               # Next.js App Router (페이지 & 레이아웃)
│   ├── components/        # 공유 UI 컴포넌트
│   │   ├── ui/            # shadcn/ui 기본 컴포넌트
│   │   └── shared/        # 프로젝트 공통 컴포넌트
│   ├── features/          # 기능별 모듈
│   │   ├── churches/      # 교회 검색·조회 (컴포넌트, 훅, 데이터 조회 함께 관리)
│   │   └── reports/       # 교회 정보 제보 (폼, Server Action) — [WIP] 인증 방식 미결정
│   ├── lib/               # 유틸리티 (supabase 클라이언트 등)
│   ├── hooks/             # 커스텀 React Hooks
│   └── types/             # 전역 TypeScript 타입
├── scripts/               # [WIP] 크롤러 — 오프라인 배치 실행, 앱 런타임과 분리
│   └── collect-kosin.ts   #        고신 교회 데이터 수집
└── data/                  # [WIP] 크롤링 결과물(JSON) — 앱/시드가 읽는 소스
    └── churches.json
```

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
- 크롤링 전용 의존성(`fast-xml-parser`, 추후 Playwright 등)은 **앱 런타임 번들에 포함하지 않는다.** 앱은 완성된 결과물(JSON 또는 Supabase 테이블)만 소비한다.

### 수집 범위

- 지역: 대한민국 국내 교회
- 신학적 범위: 좁은 개혁주의 — 개혁신앙을 명확히 표방하는 교단·독립개혁교회 중심 (예장 고신, 예장 합신, 독립개신교회, 독립개혁장로회, 개혁교회 계열, 한국 내 OPC/PCA 계열). 합동·백석·대신 포함 여부는 미결정.

### 수집 필드

교회명 · 주소 · 교단/소속 · 담임목사 · 홈페이지/SNS · 연락처 · 예배시간
(디렉토리성 소스는 예배시간·SNS가 비어 있는 경우가 많아, 개별 교회 홈페이지 2차 수집으로 보강 예정)

### 소스 & 도구

- **1단계 — 예장 고신:** Google My Maps KML 일괄 다운로드(`mid=1rElpaz34C8gWiRkcJSLzSFGUacCSjUyB`), 약 2,100개 교회. 내장 `fetch` + `fast-xml-parser`로 파싱.
- **이후 — 합신 등:** 정적 디렉토리는 `fetch` + 파서, JS 렌더링·무한스크롤 소스는 Playwright(예정).
- 파싱·정규화 함수는 유틸 성격이므로 Vitest 단위 테스트 대상으로 적합 (기존 테스트 정책과 일관).

### 저장 (미결정)

- 초기: `data/churches.json`으로 커밋해 앱이 직접 읽음 (데이터 ~3천 건, 갱신 드묾 → JSON으로 충분).
- 이후: Supabase `churches` 테이블로 시드할 수 있음. 이 경우 아래 "Supabase Data API GRANT 정책"에 따라 신규 테이블 GRANT/RLS 구문을 함께 실행해야 함.

### 준수 사항

- 각 소스의 `robots.txt`·이용약관 확인 (합신 사이트는 자동 접근 차단 확인됨 → 저빈도 수집 또는 총회 데이터 요청).
- 요청 간 지연(초당 1건 이하), User-Agent 명시.
- 담임목사 개인 휴대폰·개인 이메일 등은 수집·저장 지양. 교회 대표 연락처 위주.

### 미결정 사항

- 저장소: 정적 JSON vs Supabase 테이블
- 갱신 주기 및 스케줄 자동화(GitHub Actions) 여부
- 합동·백석·대신 포함 여부
- 디렉토리 UI를 둘 위치 (예: `features/churches`)
- 사용자 제보 기능의 인증 방식(로그인 없이 폼만 vs Magic Link 등) 및 관리자 검토 화면 필요 여부 — `features/reports` 참조

---

## Supabase Data API GRANT 정책 (2026년 변경 사항)

2026년 10월 30일부터 기존 프로젝트 포함 전체에 적용. `public` 스키마에 새로 만드는 테이블은 명시적 GRANT 없이는 supabase-js 클라이언트로 접근 불가.

- **기존 테이블**: 영향 없음 (grant 이미 부여됨)
- **새 테이블 추가 시**: 테이블 생성 SQL에 아래 GRANT 구문을 반드시 함께 실행 (예: `churches` 테이블)

```sql
grant select on public.새테이블 to anon;
grant select, insert, update, delete on public.새테이블 to authenticated;
grant select, insert, update, delete on public.새테이블 to service_role;
alter table public.새테이블 enable row level security;
```

에러 발생 시 PostgREST가 `42501` 에러와 함께 필요한 GRANT 구문을 안내함.

---

## SEO 운영 가이드

### 자동 처리 (추가 작업 불필요)

- **교회 상세 페이지**: `generateMetadata`가 DB에서 동적으로 title/description/OG/canonical 생성
- **sitemap.xml**: `src/app/sitemap.ts`가 DB 조회해서 자동 생성 — 크롤러로 새로 추가된 교회도 자동 포함
- **JSON-LD (Organization·WebSite)**: `src/app/layout.tsx`에서 전역 적용
- **JSON-LD (BreadcrumbList)**: about/vision 등 핵심 정적 페이지에 적용
- **[미결정]** 교회 상세 페이지의 구조화 데이터 스키마(`LocalBusiness`/`Church`/`Place` 중 선택) — 확정되는 대로 `src/lib/json-ld.ts`에 헬퍼 추가

### 새 페이지/교단(교회 그룹) 추가 시에만 수동 작업 필요

1. **새 정적 페이지** (`page.tsx` 신규 생성) → 파일 상단에 `export const metadata: Metadata = { title, description, openGraph }` 추가
2. **새 교단 데이터 추가** (예: 합신 크롤러 결과 반영) → `src/app/sitemap.ts`가 DB 조회 기반이라면 별도 작업 불필요. 정적 라우트를 교단별로 나눈다면 `STATIC_ROUTES`에 경로 추가
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
