# MediVibe AI — 개발 로드맵 및 배포 계획

## 배포 현황

| 항목 | 상태 | 내용 |
|------|------|------|
| **프로덕션 URL** | ✅ 완료 | https://medivibe-ai.vercel.app |
| **플랫폼** | Vercel (Hobby) | Next.js App Router 자동 인식 |
| **브랜치 연결** | `main` → 자동 배포 | push 즉시 빌드 트리거 |
| **환경 변수** | Vercel Dashboard 설정 | `ANTHROPIC_API_KEY` |
| **Preview 배포** | PR 단위 자동 생성 | `*.vercel.app` 임시 URL |

---

## CI/CD 파이프라인

```
git push origin main
        │
        ▼
GitHub Actions (.github/workflows/ci.yml)
  ├── build   : TypeScript 타입 체크 + Next.js 빌드
  ├── lint    : ESLint 코드 품질 검사
  └── test    : Vitest 유닛 테스트 + Coverage 리포트 생성
        │
        ▼ (모든 job 통과 시)
Vercel 자동 배포 트리거
  └── 프로덕션 서버 업데이트 완료
```

### GitHub Actions Jobs

| Job | 트리거 | 내용 |
|-----|--------|------|
| `build` | push/PR | `tsc --noEmit` + `npm run build` |
| `lint` | push/PR | ESLint 전체 파일 검사 |
| `test` | push/PR | Vitest 49개 테스트 + V8 커버리지 리포트 아티팩트 업로드 |

### 환경 변수 관리

| 환경 | 위치 | 설명 |
|------|------|------|
| 로컬 개발 | `.env.local` (gitignore) | `ANTHROPIC_API_KEY=sk-ant-...` |
| CI/CD | GitHub Secrets | `ANTHROPIC_API_KEY` |
| 프로덕션 | Vercel Environment Variables | `ANTHROPIC_API_KEY` |

---

## 테스트 전략

### 테스트 스택

| 도구 | 버전 | 역할 |
|------|------|------|
| Vitest | ^4.1.0 | 테스트 러너 (jsdom 환경) |
| @testing-library/react | ^16.3.2 | 컴포넌트 렌더링 테스트 |
| @testing-library/jest-dom | ^6.9.1 | DOM 매처 확장 |
| @vitest/coverage-v8 | ^4.1.0 | V8 기반 커버리지 수집 |
| jsdom | ^28.1.0 | 브라우저 환경 시뮬레이션 |

### 테스트 파일 목록

```
src/__tests__/
  setup.ts               — @testing-library/jest-dom 초기화
  utils.test.ts          — 유틸 함수 테스트 (계절 매핑, 색상, truncate) ×9
  healthStorage.test.ts  — localStorage 유틸 종합 테스트 ×31
  components.test.tsx    — 컴포넌트 렌더링·인터랙션 테스트 ×14
```

**총 49개 테스트, 3개 파일**

### 테스트 커버리지 대상

| 모듈 | 테스트 항목 |
|------|-------------|
| `utils/healthStorage.ts` | todayStr, generateId, parseSymptomData, generateSessionTitle, loadSessions, saveSession, deleteSessionById, deleteSessionsByMonth, deleteAllSessions |
| `components/ConfirmDialog.tsx` | 렌더링, 버튼 클릭 콜백 |
| `components/HospitalCard.tsx` | 진료과 표시, urgency 배지, 119 버튼 조건부 렌더링, 외부 링크 |

```bash
# 로컬 테스트 실행
npm test              # 49개 테스트 단순 실행
npm run test:coverage # 커버리지 HTML 리포트 생성 (./coverage/)
npm run test:watch    # 파일 변경 감지 모드
```

---

## Sprint 1 완료 기능

### ✅ 완료

- [x] Claude API 스트리밍 채팅 (`/api/chat`)
- [x] `[SYMPTOM_DATA]` 구조화 태그로 진료과 추출
- [x] 병원 찾기 카드 (카카오맵 / 네이버지도 / 네이버 예약 / 119)
- [x] 건강기록 — localStorage 영구 저장 / 캘린더 조회 / 검색
- [x] 건강식품 추천 (`/api/supplements`) — 카테고리·정렬 필터 + 클라이언트 캐시
- [x] 건강뉴스 (`/api/health-news`) — 계절 자동 감지 + 더보기
- [x] 메뉴 패널 — 기능 안내 / 업데이트 내역 / 앱 정보 / 불만 접수
- [x] Vitest 49개 유닛 테스트 (utils + component)
- [x] V8 커버리지 리포트 (`npm run test:coverage`)
- [x] GitHub Actions CI (build + lint + test 3-job 파이프라인)
- [x] Vercel 프로덕션 배포

---

## Sprint 2 후보 (해커톤 이후)

### 기능 개선

- [ ] 회원 가입 / 로그인 (NextAuth.js)
- [ ] 건강기록 서버 동기화 (DB: Supabase 또는 PlanetScale)
- [ ] 음성 입력 지원 (Web Speech API)
- [ ] 다국어 지원 (i18n — 영어, 중국어)

### 성능 최적화

- [ ] API Route 응답 캐시 (Redis / Vercel KV)
- [ ] 이미지 최적화 (`next/image` 전환)
- [ ] Lighthouse 점수 90+ 목표

### 테스트 확대

- [ ] E2E 테스트 (Playwright)
- [ ] API Route 통합 테스트 (MSW)
- [ ] 커버리지 80% 이상 달성

### 인프라

- [ ] Staging 환경 분리 (Vercel Preview → 전용 브랜치)
- [ ] Dependabot 자동 의존성 업데이트
- [ ] Sentry 에러 모니터링 연동
