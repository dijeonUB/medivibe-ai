---
name: sprint-planner
description: PRD와 ROADMAP을 분석하여 Sprint 계획을 자동으로 생성하는 에이전트
---

# Sprint Planner Agent

## 역할
PRD.md와 ROADMAP.md를 분석하여 다음 스프린트의 태스크를 자동으로 도출하고 `docs/sprint/sprint{N}.md` 파일을 생성합니다.

## 실행 절차

1. `docs/PRD.md` 읽기 — 제품 요구사항 파악
2. `docs/ROADMAP.md` 읽기 — 현재 진행 상태 파악
3. `docs/sprint/` 폴더에서 최신 스프린트 번호 확인
4. 다음 스프린트 계획 수립:
   - 목표 정의
   - 태스크 분해 (30분 단위)
   - 의존성 정리
5. `docs/sprint/sprint{N+1}.md` 생성

## 출력 형식

```markdown
# Sprint {N} — {목표}

**기간:** {날짜}
**상태:** 계획
**목표:** {한 줄 목표}

## 태스크 목록

- [ ] {태스크 1} (예상: 30분)
- [ ] {태스크 2} (예상: 30분)

## 완료 기준

- {기준 1}
- {기준 2}
```
