---
name: frontend-design
description: Next.js + Tailwind 기반 UI 컴포넌트를 디자인 원칙에 따라 구현하는 Skill
---

# Frontend Design Skill

## 디자인 원칙

1. **모바일 우선** — 320px부터 시작하는 반응형 설계
2. **접근성** — ARIA 라벨, 키보드 네비게이션 지원
3. **성능** — 불필요한 리렌더링 방지, 이미지 최적화
4. **일관성** — Tailwind 클래스 네이밍 컨벤션 준수

## 컬러 팔레트 (MediVibe)

- Primary: `blue-600` (#2563EB)
- Background: `gray-50` (#F9FAFB)
- Surface: `white`
- Warning: `amber-50/700`
- Text: `gray-900/500`

## 컴포넌트 패턴

### 채팅 메시지
- User: `bg-blue-600 text-white` (오른쪽 정렬)
- Assistant: `bg-white border shadow-sm` (왼쪽 정렬)
- 로딩: 점 3개 바운스 애니메이션

### 버튼
- Primary: `bg-blue-600 hover:bg-blue-700`
- Disabled: `bg-gray-300 cursor-not-allowed`

## 사용법

```
/frontend-design {컴포넌트 설명}을 MediVibe 디자인 가이드에 맞게 구현해줘
```
