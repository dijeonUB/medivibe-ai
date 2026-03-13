# MediVibe AI — 프로젝트 지침

## 프로젝트 개요

유비케어 IT개발본부 해커톤 과제 — Claude API 기반 AI 의료 정보 어시스턴트 웹앱

| 항목 | 내용 |
|---|---|
| **프로젝트명** | MediVibe AI |
| **목적** | 의료 용어 설명 및 건강 Q&A 서비스 |
| **기술 스택** | Next.js 14, TypeScript, Tailwind CSS, Anthropic SDK |
| **AI 모델** | claude-haiku-4-5-20251001 |
| **배포** | Vercel |

## 아키텍처

```
src/
  app/
    api/chat/route.ts   — Claude API 스트리밍 엔드포인트
    page.tsx            — 채팅 UI (클라이언트 컴포넌트)
    layout.tsx          — 앱 레이아웃 및 메타데이터
    globals.css         — 전역 스타일
```

## 현재 스프린트

**활성 파일:** `docs/sprint/sprint1.md`

## 개발 원칙

- 모든 주석 및 커밋 메시지는 한국어로 작성
- Claude API는 항상 서버 사이드(API Route)에서 호출 — API 키 노출 방지
- 스트리밍 응답으로 사용자 경험 향상
- 의료 정보 면책 고지 항상 표시

## 코딩 규칙

- TypeScript strict 모드 준수
- 컴포넌트는 함수형으로 작성
- API 오류는 사용자 친화적 메시지로 처리
- 환경 변수: `ANTHROPIC_API_KEY` (.env.local, .gitignore 처리)

## 배포 환경 변수

Vercel 환경 변수 설정 필요:
- `ANTHROPIC_API_KEY`: Anthropic API 키
