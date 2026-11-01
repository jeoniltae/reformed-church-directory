---
plans_dir: docs/plans
design: existing   # 디자인 토큰·타이포 스케일은 docs/ui-checklist.md "원칙"을 따른다
test: auto         # npm test(Vitest) · npm run lint · npm run build
base_branch: main  # 작업은 dev, main push가 곧 Vercel 배포다
---

# feature-workflow 프로젝트 설정

<!-- 비밀값·실제 개인정보를 적지 않는다. 상세 규칙은 CLAUDE.md와 원문 문서를 가리킨다. -->

## DEFINE
- `docs/plans/`는 `.gitignore`의 `/docs/*`에 걸려 로컬 문서다 — spec·plan은 커밋되지 않는다
- 데이터를 건드리는 기능이면 "영향 범위"에 바뀌는 `data/` 파일과 `npm run church` 명령을 적는다
- 로컬 전용 파일(`scripts/admin.mts`·`scripts/admin/` — `.git/info/exclude`)을 건드리면 "영향 범위"에 **로컬 전용**이라고 표시한다

## PLAN
- 문서 갱신(CLAUDE.md 명령어·라우트 표, `.claude/skills/church-data/SKILL.md`, `docs/context-notes.md`)이 필요하면 별도 작업으로 넣는다
- `src/components/ui/`(shadcn 관리 영역)를 고치는 작업을 넣지 않는다

## BUILD
- 코딩 규칙: `docs/coding-guidelines.md`, CLAUDE.md "코드 컨벤션"
- **데이터 파일을 손으로 고치지 않는다** — `npm run church` 절차(`.claude/skills/church-data/SKILL.md`). 민감정보 훅에 막히면 우회하지 않는다
- 테스트는 유틸 함수 단위만(Vitest). 컴포넌트·E2E 테스트는 만들지 않는다(의도적 결정)
- 크롤링 의존성은 devDependency로만

## VERIFY
- `npm test` · `npm run lint`
- `data/`를 바꿨으면 `node scripts/import-source.mts --strict`
- 화면·정적 HTML·리다이렉트를 바꿨으면 `npm run build` → `npx next start`로 확인한다(`npm run dev`로는 프리페치·정적 HTML이 안 보인다)
- 관리 화면을 바꿨으면 `node --env-file=.env.local scripts/admin.mts`를 띄워 시나리오대로 직접 조작한다. 시험으로 쓴 `data/` 변경은 확인 후 되돌린다

## REVIEW
- ⚠️ `scripts/admin.mts`·`scripts/admin/`은 `.git/info/exclude` 대상이라 **git diff에 나오지 않는다** — 리뷰 대상에 이 파일들을 명시적으로 넣는다
- public 저장소다 — diff에 실제 연락처·민감정보·`.env.local` 값이 없는지 본다

## SHIP
- 작업 브랜치는 `dev`. `main` push는 곧 배포이므로 별도로 확인받는다
- CLAUDE.md(명령어·라우트 표), `.claude/skills/church-data/SKILL.md` 갱신 여부를 점검한다
- 판단 근거를 `docs/context-notes.md`에 날짜 항목으로 남긴다(로컬 문서)
- `docs/checklist.md`·`docs/ui-checklist.md`의 해당 체크박스를 갱신한다
