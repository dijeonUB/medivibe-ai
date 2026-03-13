# Sprint 1 — MediVibe AI MVP

**기간:** 2026-03-13 (1일 집중 개발)
**상태:** ✅ 완료
**목표:** Claude API 연동 AI 의료 정보 플랫폼 완성 + 해커톤 제출
**담당:** 유비케어 IT개발본부 dijeon

---

## 목차

1. [스프린트 목표 및 범위](#1-스프린트-목표-및-범위)
2. [시간대별 개발 진행 기록](#2-시간대별-개발-진행-기록)
3. [커밋별 상세 내역](#3-커밋별-상세-내역)
4. [기술 결정 과정 (ADR)](#4-기술-결정-과정-adr)
5. [발생 문제 및 해결 과정](#5-발생-문제-및-해결-과정)
6. [테스트 결과](#6-테스트-결과)
7. [빌드 및 배포 결과](#7-빌드-및-배포-결과)
8. [코드 품질 지표](#8-코드-품질-지표)
9. [완료 기능 목록](#9-완료-기능-목록)
10. [회고 및 학습](#10-회고-및-학습)

---

## 1. 스프린트 목표 및 범위

### 목표 (Definition of Done)

| 목표 | 완료 기준 | 결과 |
|------|----------|------|
| Claude API 연동 AI 채팅 | 스트리밍 응답, 멀티턴 대화 | ✅ |
| 증상 분석 → 진료과 추천 | JSON 구조화 응답 파싱, 병원찾기 링크 | ✅ |
| 건강기록 캘린더 | localStorage 영속, 월별 조회 | ✅ |
| 건강식품·건강뉴스 AI 추천 | 카테고리별 캐시, 프리로드 | ✅ |
| 반응형 레이아웃 | 모바일(하단 탭) + PC(사이드바) | ✅ |
| 컴포넌트 분리 | page.tsx 단일 파일 → 13개 모듈 | ✅ |
| 단위 테스트 | Vitest 9개 통과 | ✅ |
| Vercel 배포 | HTTPS 접근 가능 | ✅ |

### 기술 스택 선택 이유

| 기술 | 선택 이유 | 대안 검토 |
|------|----------|----------|
| Next.js 16.1 (App Router) | API Route로 서버사이드 Claude 호출 가능 → API 키 보호 | Vite + Express (분리 서버 관리 부담) |
| TypeScript strict | 컴파일 단계 타입 오류 사전 차단 | JavaScript (런타임 오류 위험) |
| Tailwind CSS 4 | 유틸리티 클래스 → 빠른 UI 프로토타이핑 | styled-components (빌드 오버헤드) |
| claude-haiku-4-5-20251001 | 응답 속도 ~1.5초, 해커톤 비용 효율 | claude-opus (느림), claude-sonnet (중간) |
| Vercel | GitHub 연동 자동 배포, 무료 서버리스 | AWS (설정 복잡), Railway (느린 cold start) |

---

## 2. 시간대별 개발 진행 기록

### 2026-03-13 (Sprint 1 전일 집중 개발)

#### 14:02 — 커밋 `d006a9a` | 프로젝트 기반 구축 + MVP 채팅 구현

**작업 내용:**
- `create-next-app` 으로 Next.js 16.1.6 프로젝트 생성
- `@anthropic-ai/sdk ^0.78.0` 설치
- `.env.local` 에 `ANTHROPIC_API_KEY` 설정, `.gitignore`에 `.env*` 패턴 등록
- `/api/chat/route.ts` 작성 — Claude 스트리밍 엔드포인트 구현
  - System Prompt: 의료 전문가 역할, 증상 분석 → 진료과 추천 + JSON 태그 포함
  - `ReadableStream` + `TextEncoder` 스트리밍 방식
  - `max_tokens: 1024`, `model: claude-haiku-4-5-20251001`
- `page.tsx` 기본 채팅 UI 작성 (메시지 목록, 입력창, 전송 버튼)
- 프로젝트 문서 초기 작성: `CLAUDE.md`, `docs/PRD.md`, `docs/ROADMAP.md`, `docs/sprint/sprint1.md`
- `.claude/agents/sprint-planner.md`, `.claude/skills/frontend-design.md` 에이전트 정의

**변경 규모:** 13개 파일 신규 생성, +451줄

**확인 사항:**
- `npm run dev` → `http://localhost:3000` 접속 확인
- Claude 채팅 기본 동작 확인 (스트리밍 텍스트 출력)

---

#### 14:16 — 커밋 `73dcd96` | 증상 분석 + 병원 찾기 기능

**작업 내용:**
- `/api/symptom/route.ts` 신규 작성 (+59줄)
  - Claude에게 JSON 형식 강제: `{ department, urgency, searchKeyword, urgencyReason }`
  - 응급도 3단계: `일반 / 주의 / 응급`
- `page.tsx` 대폭 확장 (+462줄 → 증가)
  - `SymptomData` 인터페이스 정의
  - System Prompt에 `[SYMPTOM_DATA]...[/SYMPTOM_DATA]` 구조화 데이터 삽입 지시 추가
  - `parseSymptomData()` 함수 작성 — 스트리밍 본문에서 JSON 추출
  - `HospitalCard` 컴포넌트 — 카카오맵 / 네이버지도 / 네이버예약 링크 버튼
  - 응급도별 배지 색상 (`URGENCY_STYLE` 상수)
- UBCare 브랜드 컬러 `#ec6120` 적용

**기술적 결정:**
- `/api/symptom` 를 별도 엔드포인트로 분리하지 않고 `/api/chat` System Prompt에 통합하기로 결정
  - 이유: 사용자가 자연어로 대화하면서 자동으로 증상 분석 → UX 개선
  - 구조화 데이터는 `[SYMPTOM_DATA]` 태그로 본문에 삽입, 프론트에서 파싱

**변경 규모:** 2개 파일, +400줄 / -121줄

---

#### 14:24 — 커밋 `1639f99` | 건강기록 캘린더 구현

**작업 내용:**
- `/api/chat/route.ts` 수정 (+31줄)
  - 멀티턴 대화 지원 — `messages` 배열 전달 처리
  - `max_tokens: 1024 → 2048` 증가 (대화 길이 대응)
- `page.tsx` 건강기록 기능 전면 추가
  - `HealthSession` 인터페이스: `{ id, date, createdAt, title, messages, symptomData }`
  - `loadSessions()` / `saveSession()` / `deleteSession*()` — localStorage 유틸
  - `Calendar` 컴포넌트 — 7열 그리드, 날짜별 건수 뱃지, 추천과 표시
  - `SessionCard` 컴포넌트 — 클릭 시 메시지 펼치기, 이어서 상담 버튼
  - 세션 자동 저장: AI 응답 완료 시 `persistSession()` 호출
  - `generateSessionTitle()` — 증상 데이터 우선, 없으면 첫 메시지 앞 28자

**변경 규모:** 2개 파일, +499줄 / -351줄

---

#### 14:36 — 커밋 `15e27a7` | PC 반응형 레이아웃 + UBCare 브랜딩

**작업 내용:**
- `public/ubcare-logo.png` 추가 (1.4KB)
- `public/chatbot-character.png` 추가 (7.2KB, 초기 저화질)
- PC 사이드바 레이아웃 구현 (`hidden lg:flex`)
  - 사이드바: 로고 + 네비 2개 (AI 상담 / 건강기록)
  - 모바일: 하단 탭 네비
- 메뉴 패널 (⋮ 버튼) 기본 버전 추가
- 헤더 `h-[60px]` 고정

**변경 규모:** 3개 파일, +412줄 / -357줄

---

#### 14:51 — 커밋 `86862a8` | 건강기록 버그 7건 수정

**작업 내용 (버그 목록):**

| # | 버그 증상 | 원인 | 수정 내용 |
|---|----------|------|----------|
| 1 | 챗봇 아바타 크기 불규칙 | `w-8 h-8` 미적용 | `rounded-full overflow-hidden` 추가 |
| 2 | 달력 날짜 숫자 잘림 | `h-12` 고정 → overflow | `h-16`으로 확장 + `overflow-hidden` |
| 3 | 선택된 날짜 표시 안됨 | state 초기화 타이밍 | `setSelectedDate(todayStr())` 이동 |
| 4 | 삭제 후 목록 미갱신 | `setSessions` 누락 | delete 함수 이후 `setSessions(loadSessions())` |
| 5 | 이어서 상담 탭 전환 실패 | `setView` 호출 순서 | `setView("chat")` 먼저, 메시지 로드 후 |
| 6 | 건강기록 세션 타이틀 undefined | `firstUser` undefined | optional chaining `?.content ?? ""` |
| 7 | 모바일 메뉴 터치 영역 협소 | `py-2` 부족 | `py-3` 으로 확장 |

**변경 규모:** 1개 파일, +417줄 / -122줄

---

#### 15:19 — 커밋 `713b06d` | 건강식품 추천 + 건강뉴스 + 새대화/이어서상담

**작업 내용:**
- `/api/supplements/route.ts` 신규 (+53줄)
  - Claude에게 JSON 배열 강제: `{ products: [{ rank, name, brand, ... }], categoryInfo }`
  - `max_tokens: 2048`, 카테고리 + 정렬 파라미터 처리
- `/api/health-news/route.ts` 신규 (+62줄)
  - 현재 월 → 계절 매핑 (`1~2월: 겨울, 3~5월: 봄, ...`)
  - Claude에게 계절 기반 건강 기사 8건 생성 요청
  - `{ season, weatherAlert, articles: [{ id, category, categoryColor, ... }] }`
- `page.tsx` 건강식품/뉴스 뷰 추가
  - 카테고리 8종 (면역력, 피로회복, 관절건강, 눈건강, 소화건강, 수면개선, 피부건강, 다이어트)
  - 정렬 3종 (인기순, 가격낮은순, 가격높은순)
  - 쿠팡 / 네이버쇼핑 구매 링크
  - 건강뉴스: 계절 배지, 날씨 알림 배너, 증상/예방법/추천음식 접기/펼치기
- 네비게이션 2개 → 4개 확장 (건강식품 추천, 건강뉴스 추가)
- 새 대화 버튼 (✏️) — 현재 대화를 기록에 저장 후 새 세션 시작
- 이어서 상담 버튼 — 기존 세션 메시지를 채팅창으로 복원

**변경 규모:** 3개 파일, +715줄 / -235줄

---

#### 15:34 — 커밋 `71ce75f` | 성능·UX 개선 + 메뉴 패널 확장

**작업 내용:**
- **클라이언트 캐시 도입** (핵심 성능 개선)
  - `useRef<Record<string, SupplementsData>>({})` — `"면역력_popular"` 키로 캐싱
  - 캐시 히트 시 API 호출 없이 즉시 렌더링
- **`display:none` 마운트 유지 전략**
  - 기존: `view === "supplements" && <SupplementsView />` → 탭 전환 시 언마운트
  - 변경: `style={{ display: view === "supplements" ? "block" : "none" }}` → 항상 마운트 유지
  - 효과: `useRef` 캐시 보존 + 페이지 로드 시 백그라운드 프리페치 자동 실현
- **더보기 버튼** — 5개 → 10개 (추가 비용 없이 Claude 응답 활용)
- **DataSplash 로딩 컴포넌트** — 단계별 진행 메시지 + 회전 애니메이션
- **메뉴 패널 4탭** — 기능안내, 업데이트 내역, 앱 정보, 불만접수
  - 불만접수: `mailto:` 링크로 이메일 앱 연동
- **건강식품 추천 반응형 그리드** — `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- `/api/supplements/route.ts` — `max_tokens: 2048 → 3500` (JSON 절단 방지)
- `/api/health-news/route.ts` — `max_tokens: 2048 → 3500`

**변경 규모:** 3개 파일, +412줄 / -156줄

---

#### 15:39 — 커밋 `1f389e4` | 챗봇 이미지 교체 + 스플래시 개선

**작업 내용:**
- `public/chatbot-character.jpg` 교체 (7.2KB PNG → 64.6KB JPG 고화질)
  - 이유: 저화질 PNG가 흐릿하게 표시 → 브랜드 품질 저하
- `DataSplash` 컴포넌트 정교화
  - 4단계 진행 메시지 (건강식품/뉴스 각각)
  - 점 애니메이션 (400ms 인터벌)
  - 단계 이동 (1800ms 인터벌)
  - 프로그레스 바 (완료 단계 강조 색상)

**변경 규모:** 2개 파일, +86줄 / -36줄

---

#### 15:51 — 커밋 `db7afed` | UI 최종 정제

**작업 내용:**
- 헤더 태그라인 `"Your Health Intelligence"` 변경
- 모바일 헤더 UBCare 로고만 표시 (텍스트 제거 → 심플화)
- 캘린더 너비 확장 (`lg:w-[320px] → lg:w-[360px] xl:w-[400px]`)
- 건강기록 2패널 고정 레이아웃 (`flex-1 overflow-hidden flex flex-col lg:flex-row`)
  - 문제: 검색 시 캘린더가 사라짐
  - 해결: 캘린더를 좌측 고정 패널로 분리, 우측만 스크롤
- 불만접수 이메일 `dijeon@ubcare.co.kr`로 설정

**변경 규모:** 1개 파일, +158줄 / -84줄

---

#### 16:21 — 커밋 `bce0f6f` | 해커톤 평가 보완 (문서 + CI/CD + 테스트)

**작업 내용 (1차 평가 68점 기반 보완):**

- **Vitest 단위 테스트 추가**
  - `vitest.config.ts` — jsdom 환경, globals, setup 파일
  - `src/__tests__/setup.ts` — `@testing-library/jest-dom` import
  - `src/__tests__/utils.test.ts` — 9개 테스트 케이스
    - 계절 매핑 5개 (봄/여름/가을/겨울/범위 밖)
    - 카테고리 색상 2개 (hex 형식, 면역력 색상값)
    - 텍스트 truncation 2개 (maxLen 이하/초과)
  - `package.json` — `"test": "vitest run"`, `"test:watch": "vitest"` 추가
  - devDependencies: `vitest ^4.1.0`, `@vitejs/plugin-react ^6.0.0`, `jsdom ^28.1.0`, `@testing-library/react ^16.3.2`, `@testing-library/jest-dom ^6.9.1`

- **GitHub Actions CI 파이프라인 작성**
  - `.github/workflows/ci.yml` — TypeScript 타입체크 + Next.js 빌드 + ESLint

- **문서 보완**: `docs/PRD.md` 경쟁 차별화 표, 기술 선택 이유, 성공 지표 추가

**변경 규모:** 8개 파일, +5578줄 / -3436줄 (package-lock.json 포함)

---

#### 17:09 — 커밋 `5844b85` | page.tsx 컴포넌트 분리 (코드 품질 개선)

**작업 내용 (1672줄 단일 파일 → 13개 모듈):**

| 파일 | 내용 | 줄 수 |
|------|------|-------|
| `src/types/index.ts` | ViewType, Message, HealthSession 등 8개 타입 | 65 |
| `src/constants/index.ts` | UBCARE_ORANGE, UPDATE_HISTORY 등 상수 | 85 |
| `src/utils/healthStorage.ts` | localStorage 유틸 8개 함수 | 70 |
| `src/components/icons.tsx` | SVG 아이콘 8개 (PulseIcon, CalendarIcon 등) | 75 |
| `src/components/ConfirmDialog.tsx` | 삭제 확인 모달 | 35 |
| `src/components/HospitalCard.tsx` | 병원찾기 링크 카드 | 45 |
| `src/components/Calendar.tsx` | 건강기록 캘린더 | 123 |
| `src/components/SessionCard.tsx` | 세션 목록 카드 | 78 |
| `src/components/DataSplash.tsx` | 로딩 스플래시 | 86 |
| `src/components/SupplementsView.tsx` | 건강식품 추천 전체 뷰 | 238 |
| `src/components/NewsView.tsx` | 건강뉴스 전체 뷰 | 163 |
| `src/components/MenuPanel.tsx` | 메뉴 패널 4탭 | 273 |
| `src/app/page.tsx` | Home 컴포넌트만 (레이아웃 + 상태 관리) | 464 |

**분리 기준:**
- 타입/상수: 재사용 가능한 순수 정의
- 유틸: 부수효과 없는 순수 함수
- 컴포넌트: 단일 책임 원칙 (SRP) — 하나의 UI 관심사만 처리

**변경 규모:** 13개 파일, +1358줄 / -1225줄

---

## 3. 커밋별 상세 내역

| 시각 | 커밋 | 타입 | 파일 수 | +줄 | -줄 | 핵심 변경 |
|------|------|------|--------|-----|-----|----------|
| 14:02 | `d006a9a` | feat | 13 | +451 | 0 | 프로젝트 초기화, `/api/chat` 스트리밍, 채팅 UI |
| 14:16 | `73dcd96` | feat | 2 | +400 | -121 | `/api/symptom`, 증상 분석, HospitalCard |
| 14:24 | `1639f99` | feat | 2 | +499 | -351 | 건강기록 localStorage, Calendar, SessionCard |
| 14:36 | `15e27a7` | feat | 3 | +412 | -357 | PC 사이드바, 반응형 레이아웃, 로고/캐릭터 |
| 14:51 | `86862a8` | fix | 1 | +417 | -122 | 버그 7건 (아바타, 달력, 삭제, 탭전환 등) |
| 15:19 | `713b06d` | feat | 3 | +715 | -235 | `/api/supplements`, `/api/health-news`, 네비 4개 |
| 15:34 | `71ce75f` | feat | 3 | +412 | -156 | useRef 캐시, display:none 전략, DataSplash |
| 15:39 | `1f389e4` | feat | 2 | +86 | -36 | 고화질 챗봇 이미지, DataSplash 정교화 |
| 15:51 | `db7afed` | feat | 1 | +158 | -84 | 2패널 고정, 캘린더 확대, UI 정제 |
| 16:21 | `bce0f6f` | docs | 8 | +5578 | -3436 | Vitest 테스트, CI/CD, 문서 보완 |
| 17:09 | `5844b85` | refactor | 13 | +1358 | -1225 | page.tsx → 12개 컴포넌트 분리 |
| 17:09 | `e188218` | chore | 1 | 0 | -53 | CI workflow 제거 (토큰 scope 문제) |

---

## 4. 기술 결정 과정 (ADR)

### ADR-001: Claude 모델 선택 — `claude-haiku-4-5-20251001`

**상황:** 해커톤 시연에서 응답 속도와 비용이 중요
**검토한 대안:**
- `claude-opus-4-6`: 품질 최상, 응답 ~5초, 비용 $5/1M 토큰 → 시연 중 지연 발생 우려
- `claude-sonnet-4-6`: 중간 품질, 응답 ~3초, 비용 $3/1M 토큰
- `claude-haiku-4-5-20251001`: 빠른 응답 ~1.5초, 비용 $1/1M 토큰 → **선택**

**결정 이유:** 의료 정보 어시스턴트 특성상 정확도보다 응답 속도가 시연 인상에 더 중요. 스트리밍으로 첫 토큰이 빠르게 나오면 대기감 해소. 비용 효율도 중요 (API 키 공용 사용 가능성).

---

### ADR-002: API 키 보안 — Next.js API Route 서버사이드 호출

**상황:** Claude API 키를 어디서 호출할 것인가
**검토한 대안:**
- 클라이언트 직접 호출: 구현 간단, API 키 브라우저 노출 → **거부** (보안 결함)
- Next.js API Route (`/api/chat`): 서버에서만 실행, 클라이언트에 키 미전달 → **선택**

**결정 이유:** `.env.local`의 `ANTHROPIC_API_KEY`는 서버 환경 변수로만 접근 가능. 브라우저 네트워크 탭에 키가 노출되지 않음. Vercel 환경변수 설정으로 배포 환경도 동일하게 보호.

---

### ADR-003: 구조화 응답 — `[SYMPTOM_DATA]` 태그 방식

**상황:** Claude 응답에서 증상 분석 JSON을 어떻게 추출할 것인가
**검토한 대안:**
- 별도 API 2번 호출: `/api/chat` + `/api/symptom` 순차 호출 → 응답 시간 2배
- JSON 모드 (응답 전체를 JSON으로): 자연어 설명 불가능 → UX 저하
- 커스텀 태그 `[SYMPTOM_DATA]...[/SYMPTOM_DATA]`: 자연어 + 구조화 데이터 공존 → **선택**

**결정 이유:** System Prompt에서 "응답 마지막에 태그를 붙여라" 지시 → 스트리밍 중 태그를 실시간 제거해서 사용자에게 보이는 텍스트를 깔끔하게 유지. 스트리밍 완료 후 `parseSymptomData()`로 JSON 추출. API 1회 호출로 해결.

---

### ADR-004: 캐시 전략 — `useRef` + `display:none`

**상황:** 건강식품/뉴스 탭 전환 시 매번 API를 호출하면 UX 저하
**검토한 대안:**
- `useState` 전역 상태: Context나 Zustand 설치 필요, 복잡성 증가
- `&&` 조건부 렌더링 + 상위 state 캐시: 컴포넌트 언마운트 → `useRef` 캐시 초기화
- `display:none` + `useRef` 내부 캐시: 컴포넌트 항상 마운트 → `useRef` 유지 → **선택**

**결정 이유:**
- `display:none`으로 항상 마운트 유지 → `useRef` 캐시 생존
- 부수 효과: 페이지 로드 시 `useEffect`가 즉시 실행 → 백그라운드 프리페치 자동 실현
- 추가 라이브러리 없이 React 기본 기능만으로 구현

---

### ADR-005: 컴포넌트 분리 시점 — 초반 분리 vs 나중 분리

**상황:** 1672줄 단일 파일이 코드 품질 점수 감점
**검토한 대안:**
- 처음부터 분리: 개발 속도 감소, 인터페이스 설계 오버헤드
- 나중에 분리 (채택): MVP 빠르게 완성 → 동작 확인 → 리팩토링 → **선택**

**결정 이유:** 해커톤 특성상 "동작하는 데모"가 우선. MVP 완성 후 TypeScript 타입, 상수, 유틸, 컴포넌트 순서로 단계적 분리. `npx tsc --noEmit` + `npm run build` 로 분리 후 동작 검증.

---

## 5. 발생 문제 및 해결 과정

### 문제 1: 건강식품 JSON 절단 오류

**발생 시각:** 15:19 (`713b06d` 커밋 직후 테스트 중)

**증상:**
```
SyntaxError: Unexpected end of JSON input
at JSON.parse (...)
```

**원인 분석:**
- Claude가 `{ products: [...` 까지 생성하다가 `max_tokens: 2048` 한계로 절단
- 10개 제품 × 8개 필드 (name, brand, mainBenefit, benefits[], priceRange, unit, searchKeyword, tags[]) = 약 3000~4000 토큰 필요

**해결 과정:**
1. `max_tokens: 2048` → `3500`으로 증가 (`71ce75f` 커밋)
2. API Route에 `try/catch` + 사용자 친화적 오류 메시지 추가
3. 재확인: 10개 제품 완전히 반환됨 ✅

---

### 문제 2: 탭 전환 시 캐시 초기화

**발생 시각:** 15:19 이후 탭 전환 테스트 중

**증상:** 건강식품 탭에서 "면역력" 조회 → AI 상담 탭 이동 → 건강식품 탭 재진입 → 처음부터 다시 API 호출

**원인 분석:**
```tsx
// 문제 코드: 탭 전환 시 SupplementsView 언마운트됨
{view === "supplements" && <SupplementsView />}
// → 언마운트 → useRef 캐시 소멸 → 재마운트 시 빈 캐시로 시작
```

**해결 과정:**
1. `&&` 조건부 렌더링 → `display:none` 방식으로 변경
2. 항상 마운트 → `useRef` 캐시 생존 → 탭 전환 시 즉시 표시 ✅
3. 부수 효과 확인: 페이지 로드 시 백그라운드 프리페치 자동 실현 ✅

```tsx
// 해결 코드
<div style={{ display: view === "supplements" ? "block" : "none" }}>
  <SupplementsView />
</div>
```

---

### 문제 3: 건강기록 검색 시 캘린더 사라짐

**발생 시각:** `86862a8` 버그 수정 이후 추가 발견

**증상:** 검색창에 키워드 입력 → 캘린더 영역이 사라지고 검색 결과만 표시

**원인 분석:**
- 기존 레이아웃: 캘린더와 세션 목록이 동일 영역에 조건부 표시
- 검색 상태 진입 시 `selectedDate`가 null → 캘린더 렌더링 조건 false

**해결 과정:**
- 2패널 고정 레이아웃으로 재설계 (`db7afed` 커밋)
- 좌측: 캘린더 항상 표시 (`lg:w-[360px]` 고정)
- 우측: 검색/날짜별 결과 (독립 스크롤)

---

### 문제 4: GitHub Actions push 거부

**발생 시각:** `bce0f6f` 커밋 push 시도 중

**증상:**
```
refusing to allow an OAuth App to create or update workflow
`.github/workflows/ci.yml` without `workflow` scope
```

**원인 분석:**
- GitHub Personal Access Token에 `workflow` scope 미설정
- `ci.yml`이 `.github/workflows/` 경로에 있어서 workflow 권한 필요

**해결 과정:**
- 임시 해결: `ci.yml`을 git에서 제거 후 push (`e188218` 커밋)
- 영구 해결 방법: [github.com/settings/tokens](https://github.com/settings/tokens) → token → `workflow` scope 체크

---

### 문제 5: Vercel 배포 후 AI 기능 미동작

**발생 시각:** Vercel 배포 직후

**증상:** 채팅 전송 → `{"error": "Internal Server Error"}`

**원인 분석:**
- `.env.local`은 로컬 개발 환경에만 존재
- Vercel 서버에는 `ANTHROPIC_API_KEY` 환경변수가 설정되지 않음

**해결 과정:**
- Vercel Dashboard → Settings → Environment Variables → `ANTHROPIC_API_KEY` 추가
- Redeploy 실행 → 정상 동작 확인 ✅

---

## 6. 테스트 결과

### 단위 테스트 (Vitest)

```
> vitest run

 RUN  v4.1.0

 Test Files  1 passed (1)
      Tests  9 passed (9)
   Start at  17:08:31
   Duration  1.53s (transform 21ms, setup 131ms, import 25ms, tests 3ms)
```

**테스트 케이스 상세:**

| 테스트 스위트 | 케이스 | 결과 |
|---|---|---|
| 계절 매핑 | 3~5월은 봄 | ✅ pass |
| 계절 매핑 | 6~8월은 여름 | ✅ pass |
| 계절 매핑 | 9~11월은 가을 | ✅ pass |
| 계절 매핑 | 12, 1, 2월은 겨울 | ✅ pass |
| 계절 매핑 | 범위 밖 값은 기본값 봄 | ✅ pass |
| 뉴스 카테고리 색상 | 모든 카테고리 hex 색상 코드 정의됨 | ✅ pass |
| 뉴스 카테고리 색상 | 면역력 카테고리는 파란색 계열 | ✅ pass |
| 텍스트 잘라내기 | maxLen 이하 문자열 그대로 반환 | ✅ pass |
| 텍스트 잘라내기 | maxLen 초과 문자열은 잘라냄 | ✅ pass |

**테스트 실패 이력 및 수정:**

| 원인 | 기댓값 오류 | 수정 |
|------|------------|------|
| `truncate("이비인후과", 4)` 기댓값 `"이비인"` (3글자) | `slice(0,4)` 는 4글자 반환 | 기댓값 `"이비인후"` 로 수정 |

### TypeScript 타입 체크

```bash
$ npx tsc --noEmit
# 출력 없음 (오류 0건)
```

---

## 7. 빌드 및 배포 결과

### 프로덕션 빌드 (`npm run build`)

```
▲ Next.js 16.1.6 (Turbopack)
✓ Compiled successfully in 1589.3ms
✓ Generating static pages (8/8) in 433.0ms

Route (app)
┌ ○ /                    → 정적 렌더링
├ ○ /_not-found
├ ƒ /api/chat            → 서버리스 함수
├ ƒ /api/health-news     → 서버리스 함수
├ ƒ /api/supplements     → 서버리스 함수
└ ƒ /api/symptom         → 서버리스 함수
```

### Vercel 배포 정보

| 항목 | 내용 |
|------|------|
| 배포 URL | https://medivibe-ai-app.vercel.app/ |
| 배포 방식 | GitHub main 브랜치 push → 자동 배포 |
| 환경변수 | `ANTHROPIC_API_KEY` Vercel Dashboard 설정 |
| 런타임 | Node.js 서버리스 (Edge Runtime 비사용) |
| 빌드 시간 | ~1.6초 (Turbopack) |
| Cold Start | API Route 첫 호출 시 ~0.5초 |

### API 응답 성능 (로컬 측정)

| 엔드포인트 | 첫 토큰 응답 | 전체 완료 |
|-----------|------------|---------|
| `/api/chat` | ~1.5초 | ~4~8초 (스트리밍) |
| `/api/symptom` | N/A | ~2초 |
| `/api/supplements` | N/A | ~5~7초 |
| `/api/health-news` | N/A | ~5~7초 |

---

## 8. 코드 품질 지표

### 파일 크기 변화 (리팩토링 전후)

| 측정 항목 | 리팩토링 전 | 리팩토링 후 |
|----------|-----------|-----------|
| `page.tsx` 줄 수 | 1,672줄 | 464줄 (-72%) |
| 총 소스 파일 수 | 6개 | 19개 |
| 파일당 평균 줄 수 | 278줄 | 102줄 |
| 최대 파일 줄 수 | 1,672줄 | 464줄 |

### 모듈 의존성 구조

```
page.tsx (Home)
├── types/index.ts
├── constants/index.ts
├── utils/healthStorage.ts
├── components/icons.tsx
├── components/ConfirmDialog.tsx
├── components/HospitalCard.tsx
├── components/Calendar.tsx
│   └── utils/healthStorage.ts
├── components/SessionCard.tsx
│   ├── constants/index.ts
│   └── components/icons.tsx
├── components/SupplementsView.tsx
│   ├── components/icons.tsx
│   └── components/DataSplash.tsx
├── components/NewsView.tsx
│   ├── components/icons.tsx
│   └── components/DataSplash.tsx
└── components/MenuPanel.tsx
    ├── constants/index.ts
    └── components/icons.tsx
```

### 코딩 규칙 준수 현황

| 규칙 | 상태 |
|------|------|
| TypeScript strict 모드 | ✅ `tsconfig.json` `"strict": true` |
| 컴포넌트 함수형 작성 | ✅ 전체 컴포넌트 `function` 선언 |
| API 오류 사용자 친화적 처리 | ✅ `try/catch` 전 API Route |
| API 키 서버 사이드만 호출 | ✅ `/api/*` Route에서만 사용 |
| `"use client"` 지시어 명시 | ✅ 클라이언트 컴포넌트 전체 |
| 한국어 주석 | ✅ 전체 소스 파일 |

---

## 9. 완료 기능 목록

### API 엔드포인트 (4개)

| 엔드포인트 | 메서드 | 기능 | 응답 형식 |
|-----------|--------|------|---------|
| `/api/chat` | POST | 멀티턴 AI 건강 상담, 스트리밍 | `ReadableStream` (text/plain) |
| `/api/symptom` | POST | 증상 분석 → 진료과·긴급도 | JSON `{ department, urgency, ... }` |
| `/api/supplements` | POST | 카테고리·정렬별 건강식품 10개 추천 | JSON `{ products[], categoryInfo }` |
| `/api/health-news` | POST | 월·계절 기반 건강기사 8건 생성 | JSON `{ season, weatherAlert, articles[] }` |

### UI 기능 (12개 컴포넌트)

| 컴포넌트 | 핵심 기능 |
|---------|---------|
| `Home` (`page.tsx`) | 전체 상태 관리, 레이아웃, 라우팅 |
| `Calendar` | 7열 그리드, 날짜별 건수, 월 이동, 범례 |
| `SessionCard` | 메시지 펼치기, 병원찾기, 이어서 상담 |
| `SupplementsView` | 카테고리 8종, 정렬 3종, 캐시, 더보기 |
| `NewsView` | 계절별 기사, 증상/예방법/음식 접기/펼치기 |
| `MenuPanel` | 기능안내, 업데이트, 앱정보, 불만접수 4탭 |
| `DataSplash` | 4단계 진행 메시지, 회전 링, 프로그레스 바 |
| `HospitalCard` | 카카오맵, 네이버지도, 네이버예약, 119 신고 |
| `ConfirmDialog` | 삭제 확인 모달 |
| `icons.tsx` | SVG 아이콘 8개 |

---

## 10. 회고 및 학습

### 잘 된 점

1. **스트리밍 + 구조화 데이터 공존 패턴** — `[SYMPTOM_DATA]` 태그를 스트리밍 중 실시간 제거하면서 UI에는 깔끔한 텍스트만 표시, 완료 후 JSON 추출. API 1회 호출로 두 가지 데이터를 동시에 처리하는 효율적인 패턴 학습.

2. **`display:none` 마운트 유지 전략** — React 컴포넌트의 마운트/언마운트 생명주기를 활용한 캐시 전략. `useRef`가 컴포넌트 생존 동안만 유지된다는 특성 + `display:none`으로 생존 보장. 프리페치도 공짜로 얻는 이중 효과.

3. **1일 MVP 완성 → 점진적 개선 사이클** — 기본 채팅(14:02) → 증상 분석(14:16) → 캘린더(14:24) → 레이아웃(14:36) → 버그 수정(14:51) → 기능 확장(15:19) → 성능 최적화(15:34) → 품질 개선(16:21~17:09). 매 커밋마다 동작 확인 후 다음 단계 진행.

### 개선할 점

1. **초기부터 컴포넌트 분리** — 1672줄 단일 파일로 개발 후 나중에 분리하는 방식은 리팩토링 비용이 크다. 기능 단위로 처음부터 파일 분리를 하는 것이 유지보수성에 유리.

2. **테스트 코드 선행 작성 (TDD)** — 유틸 함수를 먼저 작성하고 테스트로 검증하는 방식이 결함을 일찍 발견함. `truncate` 기댓값 오류가 TDD였다면 초기에 잡혔을 것.

3. **GitHub Token 권한 사전 확인** — CI/CD 파이프라인을 나중에 추가하려다 `workflow` scope 문제로 시간 낭비. 프로젝트 시작 전 토큰 권한 체크가 필요.

### 기술 인사이트

- **Claude System Prompt 설계가 핵심** — JSON 강제, 태그 방식, 계절 매핑 등 모든 AI 기능의 품질은 Prompt Engineering에 달려 있음. `max_tokens` 부족이 JSON 절단의 주원인.
- **Next.js App Router + Vercel = 최적 서버리스 조합** — API Route가 자동으로 서버리스 함수로 배포됨. 별도 백엔드 서버 불필요.
- **Vitest + jsdom 환경** — Next.js 프로젝트에서 Jest 대신 Vitest 사용이 설정 간편하고 속도도 빠름 (`Duration 1.53s`).

---

*마지막 업데이트: 2026-03-13 17:10*
*작성: dijeon (유비케어 IT개발본부)*
