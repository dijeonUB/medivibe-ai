# Sprint 1 — MediVibe AI MVP

**기간:** 2026-03-13
**상태:** 진행 중
**목표:** Claude API 연동 채팅 앱 완성 및 Vercel 배포

---

## 완료된 작업

- [x] PRD.md 작성 — 제품 요구사항, 기술 스택, 제약 조건 정의
- [x] ROADMAP.md 작성 — 스프린트 계획 및 마일스톤 설정
- [x] CLAUDE.md 작성 — 프로젝트 컨텍스트 문서화
- [x] Next.js 프로젝트 생성 (TypeScript, Tailwind, App Router)
- [x] `@anthropic-ai/sdk` 설치
- [x] `/api/chat` API Route 구현 — Claude 스트리밍 응답
- [x] 채팅 UI `page.tsx` 구현
  - 메시지 목록 (user/assistant 구분)
  - 스트리밍 응답 실시간 표시
  - 빠른 질문 예시 버튼 5개
  - 로딩 상태 (점 3개 애니메이션)
  - 면책 고지 배너
- [x] `layout.tsx` 메타데이터 한국어 설정
- [x] `.claude/agents/`, `.claude/skills/` 구조 설정

---

## 진행 중인 작업

- [ ] GitHub 저장소 생성 및 초기 커밋 push
- [ ] Vercel 배포 설정 (ANTHROPIC_API_KEY 환경 변수)

---

## 다음 작업 (Sprint 2 예정)

- [ ] 마크다운 렌더링 지원
- [ ] 대화 기록 로컬 저장
- [ ] 카테고리별 질문 탭

---

## 기술 결정 사항

| 결정 | 이유 |
|---|---|
| claude-haiku-4-5-20251001 모델 | 빠른 응답 속도, 비용 효율 |
| 스트리밍 응답 | 사용자 경험 향상 (첫 토큰 빠르게 표시) |
| API Route 서버 사이드 | API 키 클라이언트 노출 방지 |
| Tailwind CSS | 빠른 UI 개발, 반응형 지원 |
