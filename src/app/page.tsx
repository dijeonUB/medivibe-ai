"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── 타입 ────────────────────────────────────────────────
type ViewType = "chat" | "records" | "supplements" | "news";

interface SymptomData {
  department: string;
  urgency: "일반" | "주의" | "응급";
  searchKeyword: string;
  urgencyReason: string;
}
interface Message {
  role: "user" | "assistant";
  content: string;
  symptomData?: SymptomData;
}
interface HealthSession {
  id: string;
  date: string;
  createdAt: string;
  title: string;
  messages: Message[];
  symptomData?: SymptomData;
}
interface SupplementProduct {
  rank: number;
  name: string;
  brand: string;
  mainBenefit: string;
  benefits: string[];
  priceRange: string;
  unit: string;
  searchKeyword: string;
  tags: string[];
}
interface SupplementsData {
  products: SupplementProduct[];
  categoryInfo: string;
}
interface NewsArticle {
  id: number;
  category: string;
  categoryColor: string;
  title: string;
  summary: string;
  symptoms: string[];
  preventionTips: string[];
  recommendedFoods: string[];
  urgencyLevel: string;
}
interface NewsData {
  season: string;
  weatherAlert: string;
  articles: NewsArticle[];
}

// ─── 상수 ────────────────────────────────────────────────
const UBCARE_ORANGE = "#ec6120";
const STORAGE_KEY = "medivibe_sessions";
const APP_VERSION = "v1.3.0";
const BUILD_DATE = "2026-03-13";
const FEEDBACK_EMAIL = "medivibe@ubcare.co.kr";

const URGENCY_STYLE = {
  일반: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: "✅" },
  주의: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", icon: "⚠️" },
  응급: { bg: "bg-red-100",   text: "text-red-800",   border: "border-red-200",   icon: "🚨" },
};

const QUICK_QUESTIONS = [
  "머리가 깨질 것처럼 아프고 구토가 나요",
  "3일째 38도 열이 안 내려가요",
  "가슴이 답답하고 숨쉬기 힘들어요",
  "무릎이 붓고 걸을 때 통증이 심해요",
  "고혈압이란 무엇인가요?",
];

const TECH_STACK = [
  { category: "프론트엔드", items: ["Next.js 16.1 (App Router)", "TypeScript 5", "Tailwind CSS 4"] },
  { category: "AI / API", items: ["Anthropic Claude API", "claude-haiku-4-5-20251001", "@anthropic-ai/sdk"] },
  { category: "백엔드", items: ["Next.js API Routes (서버리스)", "Edge Runtime 스트리밍"] },
  { category: "데이터", items: ["localStorage (건강기록 저장)", "JSON 구조화 데이터"] },
  { category: "배포", items: ["Vercel (정적/서버리스 하이브리드)"] },
  { category: "개발 방법론", items: ["AI-Native 개발 (Vibe Coding)", "Claude Code CLI"] },
];

// ─── SVG 아이콘 ──────────────────────────────────────────
interface IconProps { className?: string; style?: React.CSSProperties; }

function PulseIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function CalendarIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
    </svg>
  );
}
function PillIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}
function NewsIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
    </svg>
  );
}
function EditIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function TrashIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function SearchIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function ReplyIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 17 4 12 9 7" />
      <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

// ─── 업데이트 내역 ────────────────────────────────────────
const UPDATE_HISTORY = [
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

// ─── 기능 가이드 (아이콘 컴포넌트 정의 이후) ──────────────
const FEATURE_GUIDE = [
  {
    icon: <PulseIcon className="w-4 h-4" />,
    title: "AI 건강 상담",
    steps: [
      "증상이나 건강 질문을 자유롭게 입력하세요.",
      "AI가 진료과를 자동으로 추천하고 병원 찾기까지 연결해드립니다.",
      "✏️ 버튼으로 새 대화를 시작하면 기존 대화는 기록에 저장됩니다.",
    ],
  },
  {
    icon: <CalendarIcon className="w-4 h-4" />,
    title: "건강기록",
    steps: [
      "캘린더에서 상담 날짜를 확인하고 과거 기록을 조회하세요.",
      "키워드로 상담 기록을 검색할 수 있습니다.",
      "'이어서 상담' 버튼으로 이전 대화를 이어갈 수 있습니다.",
      "개별/월별/전체 삭제 기능을 지원합니다.",
    ],
  },
  {
    icon: <PillIcon className="w-4 h-4" />,
    title: "건강식품 추천",
    steps: [
      "카테고리(면역력, 피로회복 등)를 선택하세요.",
      "인기순·가격순으로 정렬해 볼 수 있습니다.",
      "쿠팡·네이버쇼핑 버튼으로 바로 구매 연결됩니다.",
    ],
  },
  {
    icon: <NewsIcon className="w-4 h-4" />,
    title: "건강뉴스",
    steps: [
      "현재 계절에 맞는 건강 정보를 자동으로 제공합니다.",
      "계절병·미세먼지·영양관리 등 다양한 카테고리를 확인하세요.",
      "예방법, 추천 음식까지 상세 정보를 볼 수 있습니다.",
    ],
  },
];

// ─── 유틸 ────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split("T")[0]; }
function generateId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function parseSymptomData(text: string): { clean: string; symptomData?: SymptomData } {
  const match = text.match(/\[SYMPTOM_DATA\]([\s\S]*?)\[\/SYMPTOM_DATA\]/);
  if (!match) return { clean: text.trim() };
  try {
    const symptomData: SymptomData = JSON.parse(match[1].trim());
    const clean = text.replace(/\[SYMPTOM_DATA\][\s\S]*?\[\/SYMPTOM_DATA\]/g, "").trim();
    return { clean, symptomData };
  } catch { return { clean: text.replace(/\[SYMPTOM_DATA\][\s\S]*?\[\/SYMPTOM_DATA\]/g, "").trim() }; }
}

function generateSessionTitle(msgs: Message[], symptomData?: SymptomData): string {
  if (symptomData) {
    const dept = symptomData.department;
    const reason = symptomData.urgencyReason || "";
    const shortReason = reason.length > 22 ? reason.slice(0, 22) + "…" : reason;
    return shortReason ? `${dept} — ${shortReason}` : `${dept} 진료 상담`;
  }
  const firstUser = msgs.find((m) => m.role === "user")?.content ?? "";
  const firstLine = firstUser.split("\n")[0].trim();
  return firstLine.length > 28 ? firstLine.slice(0, 28) + "…" : firstLine || "건강 상담";
}

function loadSessions(): HealthSession[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveSession(session: HealthSession) {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) sessions[idx] = session; else sessions.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
function deleteSessionById(id: string) {
  const sessions = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
function deleteSessionsByMonth(year: number, month: number) {
  const sessions = loadSessions().filter((s) => {
    const d = new Date(s.date);
    return !(d.getFullYear() === year && d.getMonth() === month);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
function deleteAllSessions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

// ─── 확인 다이얼로그 ──────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">삭제 확인</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">취소</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors">삭제하기</button>
        </div>
      </div>
    </div>
  );
}

// ─── 병원 찾기 카드 ──────────────────────────────────────
function HospitalCard({ data }: { data: SymptomData }) {
  const s = URGENCY_STYLE[data.urgency] ?? URGENCY_STYLE["일반"];
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden max-w-sm">
      <div className={`px-3 py-2 flex items-center gap-2 ${s.bg} border-b ${s.border}`}>
        <span className="text-sm">{s.icon}</span>
        <span className={`font-semibold text-sm ${s.text}`}>추천 진료과: {data.department}</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${s.bg} ${s.text} ${s.border}`}>{data.urgency}</span>
      </div>
      {data.urgencyReason && <p className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">{data.urgencyReason}</p>}
      <div className="p-2.5 grid grid-cols-2 gap-1.5">
        <a href={`https://map.kakao.com/?q=${encodeURIComponent(data.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-colors">
          🗺️ 카카오맵
        </a>
        <a href={`https://map.naver.com/v5/search/${encodeURIComponent(data.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors">
          🗺️ 네이버지도
        </a>
        <a href={`https://booking.naver.com/booking/13/bizes?serviceType=1&keywords=${encodeURIComponent(data.department)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold text-white transition-colors col-span-2"
          style={{ backgroundColor: "#03c75a" }}>
          📅 네이버 예약
        </a>
        {data.urgency === "응급" && (
          <a href="tel:119" className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors col-span-2">
            🚨 119 응급 신고
          </a>
        )}
      </div>
    </div>
  );
}

// ─── 캘린더 ──────────────────────────────────────────────
function Calendar({ sessions, selectedDate, onSelectDate, onViewMonthChange }: {
  sessions: HealthSession[];
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onViewMonthChange?: (year: number, month: number) => void;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const toDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // 날짜별 세션 맵: { "2026-03-13": [session, ...] }
  const dateMap = sessions.reduce<Record<string, HealthSession[]>>((acc, s) => {
    acc[s.date] = [...(acc[s.date] ?? []), s];
    return acc;
  }, {});

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setViewDate(next);
    onViewMonthChange?.(next.getFullYear(), next.getMonth());
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={() => changeMonth(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg font-bold transition-colors">‹</button>
        <span className="font-bold text-gray-900">{year}년 {month + 1}월</span>
        <button onClick={() => changeMonth(1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg font-bold transition-colors">›</button>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center py-2.5 border-b border-gray-100 bg-gray-50">
        {["일","월","화","수","목","금","토"].map((d, i) => (
          <span key={d} className={`text-xs font-bold ${i===0?"text-red-400":i===6?"text-blue-400":"text-gray-500"}`}>{d}</span>
        ))}
      </div>
      {/* 날짜 셀 */}
      <div className="grid grid-cols-7 p-2 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="h-16" />;
          const dateStr = toDateStr(day);
          const daySessions = dateMap[dateStr] ?? [];
          const count = daySessions.length;
          const hasRecord = count > 0;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr();
          // 가장 최근 세션의 진료과
          const dept = daySessions[0]?.symptomData?.department;
          const weekday = new Date(dateStr).getDay();
          return (
            <button key={dateStr}
              onClick={() => hasRecord && onSelectDate(dateStr)}
              className={`h-16 w-full flex flex-col items-center justify-start pt-1.5 rounded-xl transition-all overflow-hidden ${
                hasRecord ? "cursor-pointer hover:scale-105" : "cursor-default"
              }`}
              style={
                isSelected
                  ? { backgroundColor: UBCARE_ORANGE }
                  : isToday
                  ? { border: `2px solid ${UBCARE_ORANGE}` }
                  : hasRecord
                  ? { backgroundColor: "#fff7f0", border: `1px solid #fed7aa` }
                  : {}
              }>
              {/* 날짜 숫자 */}
              <span className={`text-sm leading-none font-bold ${
                isSelected ? "text-white" :
                isToday ? "" :
                weekday === 0 ? "text-red-500" :
                weekday === 6 ? "text-blue-500" :
                hasRecord ? "text-gray-900" : "text-gray-400"
              }`} style={isToday && !isSelected ? { color: UBCARE_ORANGE } : {}}>
                {day}
              </span>
              {/* 건수 뱃지 */}
              {hasRecord && (
                <span className={`mt-0.5 text-[10px] font-bold leading-none ${isSelected ? "text-orange-100" : ""}`}
                  style={!isSelected ? { color: UBCARE_ORANGE } : {}}>
                  {count}건
                </span>
              )}
              {/* 추천과 */}
              {dept && (
                <span className={`mt-0.5 px-1 text-[9px] font-semibold leading-tight text-center truncate w-full ${
                  isSelected ? "text-white/80" : "text-gray-500"
                }`}>
                  {dept.length > 4 ? dept.slice(0, 4) : dept}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* 범례 */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fff7f0", border: "1px solid #fed7aa" }} />
          <span className="text-[10px] text-gray-500">상담 기록 있음</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: UBCARE_ORANGE }} />
          <span className="text-[10px] text-gray-500">선택된 날짜</span>
        </div>
      </div>
    </div>
  );
}

// ─── 세션 카드 ────────────────────────────────────────────
function SessionCard({ s, selectedSession, setSelectedSession, onDelete, onContinue }: {
  s: HealthSession;
  selectedSession: HealthSession | null;
  setSelectedSession: (s: HealthSession | null) => void;
  onDelete: (id: string) => void;
  onContinue: (s: HealthSession) => void;
}) {
  const isOpen = selectedSession?.id === s.id;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-orange-200 transition-colors">
      <div className="p-4">
        <div className="flex items-start gap-2">
          <button onClick={() => setSelectedSession(isOpen ? null : s)} className="flex-1 min-w-0 text-left">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(s.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}{s.date.replace(/-/g, ".")}{" · "}메시지 {s.messages.length}개
                </p>
              </div>
              {s.symptomData && (
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${URGENCY_STYLE[s.symptomData.urgency]?.bg} ${URGENCY_STYLE[s.symptomData.urgency]?.text} ${URGENCY_STYLE[s.symptomData.urgency]?.border}`}>
                  {URGENCY_STYLE[s.symptomData.urgency]?.icon} {s.symptomData.department}
                </span>
              )}
            </div>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
            className="flex-shrink-0 w-7 h-7 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-400 flex items-center justify-center transition-colors" title="삭제">
            <TrashIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
          {s.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "text-white" : "bg-white border border-gray-200 text-gray-800"}`}
                style={msg.role === "user" ? { backgroundColor: UBCARE_ORANGE } : {}}>
                {msg.content}
              </div>
            </div>
          ))}
          {/* 병원 검색 + 이어서 상담 버튼 */}
          <div className="pt-2 border-t border-gray-200 flex flex-wrap gap-2 items-center">
            {s.symptomData && (
              <>
                <a href={`https://map.kakao.com/?q=${encodeURIComponent(s.symptomData.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-400 text-gray-900">🗺️ 카카오맵</a>
                <a href={`https://map.naver.com/v5/search/${encodeURIComponent(s.symptomData.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white">🗺️ 네이버지도</a>
              </>
            )}
            {/* 이어서 상담 버튼 */}
            <button onClick={() => onContinue(s)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors hover:opacity-80"
              style={{ borderColor: UBCARE_ORANGE, color: UBCARE_ORANGE, backgroundColor: "#fff7f0" }}>
              <ReplyIcon className="w-3 h-3" />
              이어서 상담
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 건강식품 추천 뷰 ─────────────────────────────────────
const SUPP_CATEGORIES = [
  { id: "면역력", emoji: "🛡️" }, { id: "피로회복", emoji: "⚡" },
  { id: "관절건강", emoji: "🦴" }, { id: "눈건강", emoji: "👁️" },
  { id: "소화건강", emoji: "🌿" }, { id: "수면개선", emoji: "😴" },
  { id: "피부건강", emoji: "✨" }, { id: "다이어트", emoji: "💪" },
];
const SORT_OPTIONS = [
  { value: "popular", label: "인기순" },
  { value: "priceLow", label: "가격낮은순" },
  { value: "priceHigh", label: "가격높은순" },
];

// ─── 데이터 수집 스플래시 ───────────────────────────────────
function DataSplash({ type }: { type: "supplements" | "news" }) {
  const [dots, setDots] = useState("");
  const [step, setStep] = useState(0);

  const STEPS_SUPP = [
    "카테고리별 건강식품 데이터를 분석하고 있습니다",
    "국내 판매량 및 성분 정보를 수집하고 있습니다",
    "AI가 최적의 제품을 선별하고 있습니다",
    "추천 목록을 정리하고 있습니다",
  ];
  const STEPS_NEWS = [
    "현재 계절 건강 이슈를 분석하고 있습니다",
    "최신 의학 정보를 수집하고 있습니다",
    "AI가 핵심 건강 정보를 큐레이션하고 있습니다",
    "건강 뉴스를 정리하고 있습니다",
  ];
  const steps = type === "supplements" ? STEPS_SUPP : STEPS_NEWS;

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    const stepTimer = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 1800);
    return () => { clearInterval(dotTimer); clearInterval(stepTimer); };
  }, [steps.length]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-12">
      {/* 캐릭터 */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl" style={{ borderColor: UBCARE_ORANGE }}>
          <Image src="/chatbot-character.jpg" alt="AI 분석 중" width={96} height={96} className="w-full h-full object-cover" />
        </div>
        {/* 회전 링 */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: UBCARE_ORANGE, animationDuration: "1.2s" }} />
      </div>

      {/* 제목 */}
      <div className="text-center mb-6">
        <p className="text-base font-bold text-gray-900 mb-1">
          {type === "supplements" ? "🤖 AI 건강식품 분석 중" : "🤖 AI 건강뉴스 수집 중"}
        </p>
        <p className="text-xs text-gray-500">최신 자료를 조회하고 수집하고 있습니다{dots}</p>
      </div>

      {/* 진행 단계 */}
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse"
            style={{ backgroundColor: UBCARE_ORANGE }}>
            <span className="text-white text-xs">✦</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{steps[step]}{dots}</p>
            <div className="mt-2 flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{ backgroundColor: i <= step ? UBCARE_ORANGE : "#e5e7eb" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <p className="mt-5 text-[11px] text-gray-400 text-center leading-relaxed">
        Claude AI가 실시간으로 데이터를 분석합니다<br />잠시만 기다려 주세요 (약 5~10초)
      </p>
    </div>
  );
}

// 카테고리별 이미지 아이콘 매핑
const SUPP_ICON_MAP: Record<string, { emoji: string; bg: string; text: string }> = {
  "면역력":  { emoji: "🛡️", bg: "#fff7ed", text: "#c2410c" },
  "피로회복": { emoji: "⚡", bg: "#fefce8", text: "#a16207" },
  "관절건강": { emoji: "🦴", bg: "#f0fdf4", text: "#15803d" },
  "눈건강":  { emoji: "👁️", bg: "#eff6ff", text: "#1d4ed8" },
  "소화건강": { emoji: "🌿", bg: "#f0fdf4", text: "#166534" },
  "수면개선": { emoji: "🌙", bg: "#f5f3ff", text: "#6d28d9" },
  "피부건강": { emoji: "✨", bg: "#fdf4ff", text: "#9333ea" },
  "다이어트": { emoji: "🏃", bg: "#fff1f2", text: "#e11d48" },
};

function SupplementsView() {
  const [category, setCategory] = useState("면역력");
  const [sortBy, setSortBy] = useState("popular");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SupplementsData | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 클라이언트 캐시 (컴포넌트 생존 동안 유지)
  const cache = useRef<Record<string, SupplementsData>>({});

  const fetchSupplements = useCallback(async (cat: string, sort: string) => {
    const key = `${cat}_${sort}`;
    // 캐시 히트 시 즉시 반환
    if (cache.current[key]) {
      setData(cache.current[key]);
      setShowAll(false);
      setExpandedId(null);
      return;
    }
    setLoading(true); setError(""); setExpandedId(null); setShowAll(false);
    try {
      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, sortBy: sort }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      cache.current[key] = json;
      setData(json);
    } catch { setError("추천 목록을 불러오는 중 오류가 발생했습니다."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSupplements(category, sortBy); }, [category, sortBy, fetchSupplements]);

  const iconInfo = SUPP_ICON_MAP[category] ?? { emoji: "💊", bg: "#fff7ed", text: "#c2410c" };
  const visibleProducts = data?.products ? (showAll ? data.products : data.products.slice(0, 5)) : [];
  const hasMore = (data?.products?.length ?? 0) > 5 && !showAll;

  // 스플래시 표시 시 전체 화면
  if (loading) return <DataSplash type="supplements" />;

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-6 py-5">
      <div className="max-w-none">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <PillIcon className="w-5 h-5" style={{ color: UBCARE_ORANGE }} />
            건강식품 추천
          </h2>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 rounded-full text-xs font-semibold" style={{ color: UBCARE_ORANGE }}>
            🤖 AI 큐레이션
          </span>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SUPP_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category === cat.id ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
              }`}
              style={category === cat.id ? { backgroundColor: UBCARE_ORANGE } : {}}>
              <span>{cat.emoji}</span>{cat.id}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-2 mb-3">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === opt.value ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* 면책 고지 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4 flex items-start gap-2">
          <span className="text-blue-400 text-xs mt-0.5">ℹ️</span>
          <p className="text-xs text-blue-600">AI가 제공하는 참고용 정보입니다. 실제 가격·순위는 각 쇼핑몰에서 확인하세요.</p>
        </div>

        {/* 오류 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button onClick={() => fetchSupplements(category, sortBy)} className="text-xs text-red-500 underline">다시 시도</button>
          </div>
        )}

        {/* 카테고리 설명 */}
        {!loading && data?.categoryInfo && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">{data.categoryInfo}</p>
        )}

        {/* 제품 그리드 */}
        {!loading && visibleProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleProducts.map((product, idx) => {
                const rankColors = [
                  { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },  // 금 1위
                  { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },  // 은 2위
                  { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },  // 동 3위
                ];
                const rc = rankColors[idx] ?? { bg: "#f8fafc", text: "#94a3b8", border: "#e2e8f0" };
                return (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 flex-1">
                      <div className="flex items-start gap-3">
                        {/* 제품 아이콘 이미지 */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: iconInfo.bg }}>
                            {iconInfo.emoji}
                          </div>
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border"
                            style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}>
                            {product.rank ?? idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight">{product.name}</p>
                            <p className="text-xs font-bold flex-shrink-0 ml-1" style={{ color: UBCARE_ORANGE }}>{product.priceRange}</p>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{product.brand} · {product.unit}</p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{product.mainBenefit}</p>
                          {product.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.tags.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-medium rounded-md">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                        className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                        {expandedId === idx ? "▲ 닫기" : "▼ 상세 효능 보기"}
                      </button>

                      {expandedId === idx && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">주요 효능</p>
                          <ul className="space-y-1">
                            {product.benefits?.map((b, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="mt-0.5 flex-shrink-0" style={{ color: UBCARE_ORANGE }}>•</span>{b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 grid grid-cols-2 mt-auto">
                      <a href={`https://www.coupang.com/np/search?q=${encodeURIComponent(product.searchKeyword)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-gray-700 hover:bg-orange-50 border-r border-gray-100 transition-colors">
                        🛒 쿠팡
                      </a>
                      <a href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(product.searchKeyword)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-gray-700 hover:bg-green-50 transition-colors">
                        🔍 네이버
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 더보기 버튼 */}
            {hasMore && (
              <button onClick={() => setShowAll(true)}
                className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center justify-center gap-2">
                <span>⬇</span> 더보기 — 추가 {(data?.products?.length ?? 0) - 5}개 제품 보기
              </button>
            )}
            {showAll && (
              <button onClick={() => { setShowAll(false); setExpandedId(null); }}
                className="mt-4 w-full py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-400 hover:bg-gray-50 transition-all">
                ▲ 접기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── 건강뉴스 뷰 ──────────────────────────────────────────
const SEASON_CONFIG: Record<string, { bg: string; emoji: string; textColor: string }> = {
  "봄":  { bg: "bg-green-50",  emoji: "🌸", textColor: "text-green-700" },
  "여름": { bg: "bg-sky-50",    emoji: "☀️", textColor: "text-sky-700" },
  "가을": { bg: "bg-amber-50",  emoji: "🍂", textColor: "text-amber-700" },
  "겨울": { bg: "bg-blue-50",   emoji: "❄️", textColor: "text-blue-700" },
};

function NewsView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NewsData | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  // 뉴스는 한 번만 로드 — ref 캐시
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    const month = new Date().getMonth() + 1;
    fetch("/api/health-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
    })
      .then((r) => r.json())
      .then((json) => { if (json.error) throw new Error(json.error); setData(json); })
      .catch(() => setError("건강뉴스를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const sc = SEASON_CONFIG[data?.season ?? "봄"] ?? SEASON_CONFIG["봄"];
  const visibleArticles = data?.articles ? (showAll ? data.articles : data.articles.slice(0, 5)) : [];
  const hasMore = (data?.articles?.length ?? 0) > 5 && !showAll;

  // 스플래시 표시 시 전체 화면
  if (loading) return <DataSplash type="news" />;

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-6 py-5">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <NewsIcon className="w-5 h-5" style={{ color: UBCARE_ORANGE }} />
            건강뉴스
          </h2>
          {data && (
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.textColor}`}>
              {sc.emoji} {data.season} 건강 정보
            </span>
          )}
        </div>

        {/* 날씨 알림 배너 */}
        {data?.weatherAlert && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <span className="text-lg flex-shrink-0">🌤️</span>
            <p className="text-sm text-gray-700 font-medium leading-snug">{data.weatherAlert}</p>
          </div>
        )}

        {/* 오류 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 기사 목록 */}
        {!loading && visibleArticles.length > 0 && (
          <>
            <div className="space-y-3">
              {visibleArticles.map((article, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: article.categoryColor || UBCARE_ORANGE }}>
                        {article.category}
                      </span>
                      {article.urgencyLevel === "주의" && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">⚠️ 주의</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug">{article.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{article.summary}</p>

                    <button onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      {expandedId === idx ? "▲ 접기" : "▼ 자세히 보기"}
                    </button>

                    {expandedId === idx && (
                      <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                        {article.symptoms?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-red-600 mb-1.5">⚠️ 주의 증상</p>
                            <div className="flex flex-wrap gap-1.5">
                              {article.symptoms.map((s, i) => (
                                <span key={i} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-md font-medium">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {article.preventionTips?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1.5">✅ 예방법</p>
                            <ul className="space-y-1">
                              {article.preventionTips.map((tip, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                  <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>{tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {article.recommendedFoods?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-orange-600 mb-1.5">🍽️ 추천 음식</p>
                            <div className="flex flex-wrap gap-1.5">
                              {article.recommendedFoods.map((f, i) => (
                                <span key={i} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-md font-medium">{f}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 더보기 버튼 */}
            {hasMore && (
              <button onClick={() => setShowAll(true)}
                className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center justify-center gap-2">
                <span>⬇</span> 더보기 — 추가 {(data?.articles?.length ?? 0) - 5}개 기사 보기
              </button>
            )}
            {showAll && (
              <button onClick={() => { setShowAll(false); setExpandedId(null); }}
                className="mt-4 w-full py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-400 hover:bg-gray-50 transition-all">
                ▲ 접기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── 메뉴 패널 ───────────────────────────────────────────
function MenuPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"guide" | "updates" | "info" | "feedback">("guide");
  const [openGuide, setOpenGuide] = useState<number | null>(0);
  const [fbTitle, setFbTitle] = useState("");
  const [fbBody, setFbBody] = useState("");
  const [fbSent, setFbSent] = useState(false);

  const handleFeedbackSubmit = () => {
    if (!fbTitle.trim() || !fbBody.trim()) return;
    const subject = encodeURIComponent(`[MediVibe 불만접수] ${fbTitle}`);
    const body = encodeURIComponent(`${fbBody}\n\n---\n앱 버전: ${APP_VERSION}\n접수일: ${new Date().toLocaleDateString("ko-KR")}`);
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    setFbSent(true);
  };

  const TABS = [
    { key: "guide", label: "기능 안내" },
    { key: "updates", label: "업데이트" },
    { key: "info", label: "앱 정보" },
    { key: "feedback", label: "불만 접수" },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white w-full max-w-xs lg:max-w-sm h-full flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: UBCARE_ORANGE }}>
          <div className="flex items-center gap-2">
            <Image src="/ubcare-logo.png" alt="UBcare" width={60} height={18} className="object-contain brightness-0 invert" />
            <span className="font-bold text-white text-sm">MediVibe AI</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white text-xl">×</button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-[11px] font-semibold border-b-2 transition-colors whitespace-nowrap px-1 ${tab === t.key ? "" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              style={tab === t.key ? { borderBottomColor: UBCARE_ORANGE, color: UBCARE_ORANGE } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">

          {/* ── 기능 안내 ── */}
          {tab === "guide" && (
            <div className="p-4 space-y-2">
              <p className="text-xs text-gray-500 mb-3">각 기능의 사용 방법을 확인하세요.</p>
              {FEATURE_GUIDE.map((g, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenGuide(openGuide === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-orange-50 transition-colors">
                    <span className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      <span style={{ color: UBCARE_ORANGE }}>{g.icon}</span>{g.title}
                    </span>
                    <span className="text-gray-400 text-xs">{openGuide === i ? "▲" : "▼"}</span>
                  </button>
                  {openGuide === i && (
                    <ol className="px-4 py-3 space-y-2 bg-white">
                      {g.steps.map((step, j) => (
                        <li key={j} className="flex gap-2 text-xs text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: UBCARE_ORANGE }}>{j + 1}</span>
                          <span className="leading-5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── 업데이트 내역 ── */}
          {tab === "updates" && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-500">MediVibe AI의 기능 업데이트 내역입니다.</p>
              {UPDATE_HISTORY.map((rel, i) => (
                <div key={i} className={`rounded-xl border overflow-hidden ${i === 0 ? "border-orange-200" : "border-gray-200"}`}>
                  <div className={`flex items-center justify-between px-4 py-2.5 ${i === 0 ? "bg-orange-50" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm font-mono ${i === 0 ? "" : "text-gray-700"}`} style={i === 0 ? { color: UBCARE_ORANGE } : {}}>
                        {rel.version}
                      </span>
                      {rel.badge && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: rel.badgeColor ?? UBCARE_ORANGE }}>
                          {rel.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{rel.date}</span>
                  </div>
                  <ul className="px-4 py-3 space-y-1.5 bg-white">
                    {rel.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-700">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: UBCARE_ORANGE }}>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ── 앱 정보 ── */}
          {tab === "info" && (
            <div className="p-4 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-orange-700 mb-1">⚠️ 해커톤 시연용</p>
                <p className="text-xs text-orange-600">본 서비스는 유비케어 IT개발본부 해커톤 시연용 프로토타입입니다. 실제 의료 서비스가 아닙니다.</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                  <Image src="/ubcare-logo.png" alt="UBcare" width={72} height={22} className="object-contain" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">MediVibe AI</p>
                    <p className="text-xs text-gray-500">AI 기반 의료 정보 도우미</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between"><span className="text-gray-400">버전</span><span className="font-mono font-bold" style={{ color: UBCARE_ORANGE }}>{APP_VERSION}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">빌드 날짜</span><span className="font-mono">{BUILD_DATE}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">AI 모델</span><span className="font-mono">claude-haiku-4-5</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">개발팀</span><span>유비케어 IT개발본부</span></div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-900 mb-3">🛠️ 기술 스택</p>
                <div className="space-y-2.5">
                  {TECH_STACK.map((stack) => (
                    <div key={stack.category}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stack.category}</p>
                      <div className="flex flex-wrap gap-1">
                        {stack.items.map((item) => (
                          <span key={item} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-400">Copyright © 2026 UBcare Co., Ltd.</p>
                <p className="text-xs text-gray-400">All rights reserved.</p>
              </div>
            </div>
          )}

          {/* ── 불만 접수 ── */}
          {tab === "feedback" && (
            <div className="p-4 space-y-4">
              {fbSent ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm font-bold text-green-700 mb-1">접수 완료</p>
                  <p className="text-xs text-green-600">메일 앱이 열립니다. 전송 후 접수가 완료됩니다.</p>
                  <button onClick={() => { setFbSent(false); setFbTitle(""); setFbBody(""); }}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg text-white"
                    style={{ backgroundColor: UBCARE_ORANGE }}>
                    새 접수하기
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-blue-700 mb-0.5">📬 불만 및 개선 요청</p>
                    <p className="text-xs text-blue-600">접수 내용은 <span className="font-semibold">{FEEDBACK_EMAIL}</span>로 전달됩니다.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={fbTitle}
                        onChange={(e) => setFbTitle(e.target.value)}
                        placeholder="불만/개선 사항을 간단히 요약해주세요"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ "--tw-ring-color": UBCARE_ORANGE } as React.CSSProperties}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">내용 <span className="text-red-500">*</span></label>
                      <textarea
                        value={fbBody}
                        onChange={(e) => setFbBody(e.target.value)}
                        placeholder="불만 사항, 버그, 개선 요청 등 자세히 작성해주세요."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ "--tw-ring-color": UBCARE_ORANGE } as React.CSSProperties}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400">· 접수 버튼 클릭 시 기본 메일 앱이 열립니다.</p>
                      <p className="text-[10px] text-gray-400">· 개인정보 포함 내용은 작성하지 마세요.</p>
                    </div>
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={!fbTitle.trim() || !fbBody.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
                      style={{ backgroundColor: UBCARE_ORANGE }}>
                      📨 불만 접수하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<ViewType>("chat");
  const [menuOpen, setMenuOpen] = useState(false);

  // 채팅 — sessionId를 변경 가능하게
  const [currentSessionId, setCurrentSessionId] = useState(() => generateId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 기록
  const [sessions, setSessions] = useState<HealthSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr());
  const [selectedSession, setSelectedSession] = useState<HealthSession | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>({
    year: new Date().getFullYear(), month: new Date().getMonth(),
  });
  const [searchQuery, setSearchQuery] = useState("");

  // 삭제 다이얼로그
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => { setSessions(loadSessions()); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const persistSession = useCallback((msgs: Message[]) => {
    if (msgs.filter((m) => m.role === "user").length === 0) return;
    const lastSymptom = [...msgs].reverse().find((m) => m.symptomData)?.symptomData;
    const title = generateSessionTitle(msgs, lastSymptom);
    const session: HealthSession = {
      id: currentSessionId, date: todayStr(), createdAt: new Date().toISOString(),
      title, messages: msgs, symptomData: lastSymptom,
    };
    saveSession(session);
    setSessions(loadSessions());
  }, [currentSessionId]);

  // 새 대화 시작
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(generateId());
    setInput("");
  }, []);

  // 이전 대화 이어서 상담
  const handleContinueSession = useCallback((session: HealthSession) => {
    setMessages(session.messages);
    setCurrentSessionId(generateId()); // 새 세션 ID로 저장됨
    setView("chat");
    window.scrollTo(0, 0);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok) throw new Error("API 오류");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림 오류");
      const decoder = new TextDecoder();
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
        const display = fullText.replace(/\[SYMPTOM_DATA\][\s\S]*?(\[\/SYMPTOM_DATA\]|$)/g, "").trim();
        setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: display }; return u; });
      }
      const { clean, symptomData } = parseSymptomData(fullText);
      const finalMessages: Message[] = [...nextMessages, { role: "assistant", content: clean, symptomData }];
      setMessages(finalMessages);
      persistSession(finalMessages);
    } catch {
      setMessages((prev) => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." }; return u; });
    } finally { setIsLoading(false); }
  };

  // 삭제 핸들러
  const handleDeleteSession = (id: string) => {
    setConfirmDialog({
      message: "이 상담 기록을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.",
      onConfirm: () => {
        deleteSessionById(id);
        setSessions(loadSessions());
        if (selectedSession?.id === id) setSelectedSession(null);
        setConfirmDialog(null);
      },
    });
  };

  const handleDeleteMonth = () => {
    const { year, month } = calendarMonth;
    const count = sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
    if (count === 0) return;
    setConfirmDialog({
      message: `${year}년 ${month + 1}월 상담 기록 ${count}건을 모두 삭제하시겠습니까?`,
      onConfirm: () => {
        deleteSessionsByMonth(year, month);
        setSessions(loadSessions());
        setSelectedSession(null);
        setConfirmDialog(null);
      },
    });
  };

  const handleDeleteAll = () => {
    if (sessions.length === 0) return;
    setConfirmDialog({
      message: `전체 상담 기록 ${sessions.length}건을 모두 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`,
      onConfirm: () => {
        deleteAllSessions();
        setSessions([]);
        setSelectedSession(null);
        setSelectedDate(todayStr());
        setConfirmDialog(null);
      },
    });
  };

  const trimmedQuery = searchQuery.trim();
  const displaySessions = trimmedQuery
    ? sessions.filter((s) =>
        s.title.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        s.messages.some((m) => m.content.toLowerCase().includes(trimmedQuery.toLowerCase())) ||
        (s.symptomData?.department.toLowerCase().includes(trimmedQuery.toLowerCase()) ?? false)
      )
    : sessions.filter((s) => s.date === selectedDate);

  // ── 네비 아이템 (4개) ────────────────────────────────
  const NAV_ITEMS = [
    { key: "chat" as ViewType,        icon: (cls: string) => <PulseIcon className={cls} />,    labelLong: "AI 건강 상담",  labelShort: "AI 상담" },
    { key: "records" as ViewType,     icon: (cls: string) => <CalendarIcon className={cls} />, labelLong: "건강기록",      labelShort: "건강기록" },
    { key: "supplements" as ViewType, icon: (cls: string) => <PillIcon className={cls} />,     labelLong: "건강식품 추천", labelShort: "건기식" },
    { key: "news" as ViewType,        icon: (cls: string) => <NewsIcon className={cls} />,     labelLong: "건강뉴스",      labelShort: "뉴스" },
  ];

  // ── 채팅 영역 ────────────────────────────────────────
  const ChatArea = (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-16">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-orange-100 shadow-md flex-shrink-0">
              <Image src="/chatbot-character.jpg" alt="AI 도우미" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">무엇이 불편하신가요?</h2>
              <p className="text-gray-600 text-sm">
                증상을 말씀하시면 <span className="font-semibold" style={{ color: UBCARE_ORANGE }}>진료과 안내</span>와{" "}
                <span className="font-semibold" style={{ color: UBCARE_ORANGE }}>근처 병원</span>까지 바로 연결해드려요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all shadow-sm">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 border border-orange-100">
                    <Image src="/chatbot-character.jpg" alt="AI" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[78%] lg:max-w-[65%]`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user" ? "text-white rounded-br-sm" : "bg-white border border-gray-200 shadow-sm rounded-bl-sm text-gray-900"
                  }`} style={msg.role === "user" ? { backgroundColor: UBCARE_ORANGE } : {}}>
                    {msg.content === "" && isLoading && idx === messages.length - 1 ? (
                      <span className="inline-flex gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : msg.content}
                  </div>
                  {msg.role === "assistant" && msg.symptomData && <HospitalCard data={msg.symptomData} />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      <div className="bg-amber-50 border-t border-amber-100 px-4 py-1 text-center flex-shrink-0">
        <p className="text-xs text-amber-700">⚠️ 정보 제공 목적이며 실제 진료는 의료 전문가에게 받으세요.</p>
      </div>

      <div className="bg-white border-t border-gray-200 px-4 lg:px-8 py-3 flex-shrink-0">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="증상이나 건강 질문을 입력하세요..."
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
            disabled={isLoading} />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading}
            className="w-10 h-10 text-white rounded-xl flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            style={{ backgroundColor: input.trim() && !isLoading ? UBCARE_ORANGE : undefined }}>
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // ── 건강기록 영역 ────────────────────────────────────
  const RecordsArea = (
    <div className="h-full overflow-hidden flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" style={{ color: UBCARE_ORANGE }} />
          나의 건강 기록
        </h2>
        {sessions.length > 0 && (
          <div className="flex gap-3">
            <button onClick={handleDeleteMonth} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1">
              <TrashIcon className="w-3.5 h-3.5" />이번 달 삭제
            </button>
            <button onClick={handleDeleteAll} className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1">
              <TrashIcon className="w-3.5 h-3.5" />전체 삭제
            </button>
          </div>
        )}
      </div>

      {/* 메인 레이아웃: 좌측 캘린더 고정 + 우측 검색/리스트 */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

        {/* ── 좌측: 캘린더 (항상 표시) ── */}
        <div className="lg:w-[360px] xl:w-[400px] flex-shrink-0 overflow-y-auto px-4 pt-4 pb-4 lg:border-r border-gray-200 bg-white">
          <Calendar
            sessions={sessions}
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setSelectedSession(null); setSearchQuery(""); }}
            onViewMonthChange={(y, m) => setCalendarMonth({ year: y, month: m })}
          />
          {/* 모바일용 구분선 */}
          <div className="lg:hidden mt-4 border-t border-gray-200" />
        </div>

        {/* ── 우측: 검색 + 기록 목록 ── */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
          {/* 검색창 */}
          <div className="relative mb-3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="증상, 진료과, 키워드로 검색..."
              className="w-full pl-9 pr-8 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>

          {/* 결과 영역 */}
          {trimmedQuery ? (
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium">&ldquo;{trimmedQuery}&rdquo; 검색 결과 ({displaySessions.length}건)</p>
              {displaySessions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <SearchIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displaySessions.map((s) => (
                    <SessionCard key={s.id} s={s} selectedSession={selectedSession} setSelectedSession={setSelectedSession} onDelete={handleDeleteSession} onContinue={handleContinueSession} />
                  ))}
                </div>
              )}
            </div>
          ) : selectedDate ? (
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium">
                {selectedDate.replace(/-/g, ".")} 상담 기록 ({displaySessions.length}건)
              </p>
              {displaySessions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">이 날의 상담 기록이 없습니다.</div>
              ) : (
                <div className="space-y-2">
                  {displaySessions.map((s) => (
                    <SessionCard key={s.id} s={s} selectedSession={selectedSession} setSelectedSession={setSelectedSession} onDelete={handleDeleteSession} onContinue={handleContinueSession} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              {sessions.length === 0 ? (
                <>
                  <CalendarIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">아직 상담 기록이 없습니다.<br />AI 상담을 시작해보세요.</p>
                </>
              ) : (
                <>
                  <CalendarIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">날짜를 선택하거나<br />키워드로 검색해보세요.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── PC 사이드바 ── */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-100 flex flex-col items-center">
          <Image src="/ubcare-logo.png" alt="UBcare" width={110} height={32} className="object-contain" />
          <p className="text-[11px] font-medium tracking-wide mt-1.5" style={{ color: UBCARE_ORANGE }}>Your Health Intelligence</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button key={item.key}
              onClick={() => { setView(item.key); if (item.key === "records") setSessions(loadSessions()); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view === item.key ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={view === item.key ? { backgroundColor: UBCARE_ORANGE } : {}}>
              {item.icon("w-5 h-5")}{item.labelLong}
            </button>
          ))}
        </nav>

        {/* 새 대화 버튼 (사이드바 하단) */}
        {view === "chat" && (
          <div className="px-3 pb-2">
            <button onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ borderColor: UBCARE_ORANGE, color: UBCARE_ORANGE, backgroundColor: "#fff7f0" }}>
              <EditIcon className="w-4 h-4" />새 대화 시작
            </button>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
          <p className="font-semibold text-gray-500">MediVibe AI {APP_VERSION}</p>
          <p>Copyright © UBcare Co., Ltd.</p>
          <p className="font-medium" style={{ color: UBCARE_ORANGE }}>⚠️ 해커톤 시연용</p>
        </div>
      </aside>

      {/* ── 메인 영역 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center flex-shrink-0">
          <div className="lg:hidden flex-1 flex justify-center">
            <Image src="/ubcare-logo.png" alt="UBcare" width={100} height={28} className="object-contain" />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-sm font-bold text-gray-900 flex-1">
            {NAV_ITEMS.find((n) => n.key === view)?.icon("w-4 h-4")}
            <span style={{ color: view === "chat" || view === "records" ? undefined : UBCARE_ORANGE }}>
              {NAV_ITEMS.find((n) => n.key === view)?.labelLong}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">온라인</span>
            </div>
            <button onClick={() => setMenuOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="3" r="1.5" fill="#6b7280" />
                <circle cx="9" cy="9" r="1.5" fill="#6b7280" />
                <circle cx="9" cy="15" r="1.5" fill="#6b7280" />
              </svg>
            </button>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-hidden">
          {view === "chat" && ChatArea}
          {view === "records" && RecordsArea}
          {view === "supplements" && <SupplementsView />}
          {view === "news" && <NewsView />}
        </div>

        {/* 모바일 하단 네비 (4개) */}
        <nav className="lg:hidden bg-white border-t border-gray-200 flex flex-shrink-0">
          {NAV_ITEMS.map((item) => (
            <button key={item.key}
              onClick={() => { setView(item.key); if (item.key === "records") setSessions(loadSessions()); }}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 font-medium transition-colors ${view === item.key ? "" : "text-gray-400"}`}
              style={view === item.key ? { color: UBCARE_ORANGE } : {}}>
              {item.icon("w-5 h-5")}
              <span className="text-[10px]">{item.labelShort}</span>
            </button>
          ))}
        </nav>
      </div>

      {menuOpen && <MenuPanel onClose={() => setMenuOpen(false)} />}
      {confirmDialog && (
        <ConfirmDialog message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />
      )}
    </div>
  );
}
