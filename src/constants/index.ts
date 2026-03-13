// ─── 앱 공통 상수 ────────────────────────────────────────

export const UBCARE_ORANGE = "#ec6120";
export const STORAGE_KEY = "medivibe_sessions";
export const APP_VERSION = "v1.3.0";
export const BUILD_DATE = "2026-03-13";
export const FEEDBACK_EMAIL = "dijeon@ubcare.co.kr";

export const URGENCY_STYLE = {
  일반: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: "✅" },
  주의: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", icon: "⚠️" },
  응급: { bg: "bg-red-100",   text: "text-red-800",   border: "border-red-200",   icon: "🚨" },
};

export const QUICK_QUESTIONS = [
  "머리가 깨질 것처럼 아프고 구토가 나요",
  "3일째 38도 열이 안 내려가요",
  "가슴이 답답하고 숨쉬기 힘들어요",
  "무릎이 붓고 걸을 때 통증이 심해요",
  "고혈압이란 무엇인가요?",
];

export const TECH_STACK = [
  { category: "프론트엔드", items: ["Next.js 16.1 (App Router)", "TypeScript 5", "Tailwind CSS 4"] },
  { category: "AI / API", items: ["Anthropic Claude API", "claude-haiku-4-5-20251001", "@anthropic-ai/sdk"] },
  { category: "백엔드", items: ["Next.js API Routes (서버리스)", "Edge Runtime 스트리밍"] },
  { category: "데이터", items: ["localStorage (건강기록 저장)", "JSON 구조화 데이터"] },
  { category: "배포", items: ["Vercel (정적/서버리스 하이브리드)"] },
  { category: "개발 방법론", items: ["AI-Native 개발 (Vibe Coding)", "Claude Code CLI"] },
];

export const UPDATE_HISTORY = [
  {
    version: "v1.3.0",
    date: "2026-03-13",
    badge: "최신",
    badgeColor: "#22c55e",
    items: [
      "건강식품 추천 속도 개선 및 캐시 적용",
      "더보기 기능 — 최대 10개 제품/뉴스 조회",
      "건강식품 추천 PC 반응형 그리드 레이아웃",
      "메뉴 패널 업데이트 내역·불만 접수 탭 추가",
    ],
  },
  {
    version: "v1.2.0",
    date: "2026-03-13",
    badge: null,
    badgeColor: null,
    items: [
      "건강식품 추천 메뉴 신규 추가 (카테고리/정렬/쇼핑 링크)",
      "건강뉴스 메뉴 신규 추가 (계절별 AI 큐레이션)",
      "AI 건강상담 새 대화 버튼(✏️) 추가",
      "건강기록에서 이어서 상담 기능 추가",
      "네비게이션 2개 → 4개 확장",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-03-12",
    badge: null,
    badgeColor: null,
    items: [
      "건강기록 개별·월별·전체 삭제 기능",
      "건강기록 키워드 검색 기능",
      "챗봇 아바타 고정 원형 디자인 (버그 수정)",
      "달력 숫자 가독성 개선",
      "세션 타이틀 AI 자동 요약 적용",
      "고급 SVG 아이콘 교체 (AI 상담·건강기록)",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-03-11",
    badge: null,
    badgeColor: null,
    items: [
      "AI 건강 상담 채팅 (스트리밍 응답)",
      "증상 분석 및 진료과 추천",
      "건강기록 캘린더 뷰",
      "반응형 PC·모바일 레이아웃",
      "UBCare 로고·캐릭터 적용",
    ],
  },
];
