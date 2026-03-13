# ROADMAP — MediVibe AI 개발 로드맵

## 개발 철학 (Karpathy Guidelines 적용)

1. **단순하게 시작하라** — 채팅 UI 하나로 시작, 복잡도는 필요할 때만 추가
2. **직접 눈으로 확인하라** — 각 스프린트마다 브라우저에서 직접 검증
3. **과도한 추상화를 경계하라** — 현재 필요한 기능만 구현

---

## Sprint 1 — 핵심 기능 구현 (완료 목표: 2026-03-13)

### 목표
Claude API 연동 채팅 UI 완성 및 Vercel 배포

### 태스크
- [x] Next.js 프로젝트 생성 (TypeScript + Tailwind)
- [x] Anthropic SDK 설치 및 API Route 구현
- [x] 스트리밍 응답 구현
- [x] 채팅 UI 구현 (메시지 목록, 입력창, 전송 버튼)
- [x] 빠른 질문 예시 버튼 구현
- [x] 면책 고지 UI 추가
- [x] CLAUDE.md, PRD.md, ROADMAP.md 작성
- [x] .claude/agents/, .claude/skills/ 구성
- [ ] GitHub 저장소 생성 및 push
- [ ] Vercel 배포

---

## Sprint 2 — 품질 개선 (예정)

### 목표
UX 개선 및 기능 확장

### 예정 태스크
- [ ] 마크다운 렌더링 (bold, list 등)
- [ ] 대화 기록 로컬 저장 (localStorage)
- [ ] 카테고리별 질문 탭 (증상/용어/약물)
- [ ] 다크 모드 지원
- [ ] 응답 복사 버튼

---

## 마일스톤

| 마일스톤 | 목표일 | 상태 |
|---|---|---|
| MVP 완성 및 배포 | 2026-03-13 | 진행 중 |
| 해커톤 제출 | 2026-03-16 10:00 | 예정 |
