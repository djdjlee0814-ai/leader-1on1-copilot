# Leader 1:1 Copilot

리더가 1~2분 안에 최소한의 정보만 입력하면, 30분짜리 1:1 면담을 직원 중심으로
진행할 수 있도록 대화 가이드를 만들어 주는 AI 코파일럿입니다.

- **성과면담** — 목표와 결과를 함께 확인하고, 성과 Gap의 원인을 탐색해 다음 기대수준과 Action을 합의
- **성장·육성면담** — 강점, 업무역량, 동기, 새로운 역할, 커리어 등 성장 방향과 필요한 지원을 탐색

두 면담은 순서가 아니라 서로 독립적이며, 같은 팀원에게 여러 번 진행할 수 있습니다.

## 화면 흐름

```
로그인 → 면담 준비 입력 → AI 면담 가이드 → (선택) 실시간 도움 → Action & Follow-up 저장
```

면담 가이드는 이번 면담의 핵심 요약, 시간대별 면담 흐름, 단계별 핵심 질문과 Leader Tip,
"직원이 이렇게 답한다면" 후속 질문으로 구성됩니다.

## 기술 스택

- **Next.js 16** (App Router) — 화면과 서버 API를 한 프로젝트에서 처리
- **Supabase** — Google/이메일 로그인, Postgres, RLS
- **Vercel** — 배포
- **OpenAI** — 면담 가이드 생성 (서버에서만 호출)

## 로컬 실행

```bash
npm install
npm run dev
```

`.env`에 다음 값이 필요합니다.

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable 키 |
| `OPENAI_API_KEY` | OpenAI API 키 (서버 전용, 화면에 노출되지 않음) |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Google provider 설정 완료 후 `true` |

## 권한 구조

| 데이터 | leader | admin |
| --- | --- | --- |
| 면담 기록 읽기 | 본인 것만 | 전체 |
| 면담 기록 수정·삭제 | 본인 것만 | 본인 것만 |
| 초대 허용 목록 | 조회 불가 | 읽기·쓰기 |
| 사용자 목록·역할 | 본인 프로필만 | 전체 |

가입은 초대 전용입니다. `allowed_leaders` 테이블에 없는 이메일은 계정 생성 단계에서 차단됩니다.

## 데이터베이스

스키마와 RLS 정책은 [`supabase/migrations/0001_init_auth_and_sessions.sql`](supabase/migrations/0001_init_auth_and_sessions.sql)에
있습니다. Supabase SQL Editor에 그대로 붙여넣어 실행할 수 있습니다.

초대는 관리자가 아래처럼 추가합니다.

```sql
insert into public.allowed_leaders (email, role, note)
values ('someone@example.com', 'leader', '팀장');
```

## 배포

`main` 브랜치에 push하면 Vercel이 자동으로 배포합니다.

## AI 안전 원칙

- 직원의 태도·성격·능력·동기를 근거 없이 단정하지 않고, 확인된 사실과 확인이 필요한 가설을 분리합니다.
- 건강, 가족계획, 종교, 정치 성향 등 민감한 개인정보를 탐문하는 질문을 만들지 않습니다.
- 코칭 면담과 징계·PIP 등 공식 성과관리 절차를 구분합니다.
- 평가등급(S~D)은 AI가 제안하지 않고 리더가 직접 결정합니다.
