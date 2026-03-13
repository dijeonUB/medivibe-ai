"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── 타입 ────────────────────────────────────────────────
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

// ─── 상수 ────────────────────────────────────────────────
const UBCARE_ORANGE = "#ec6120";
const STORAGE_KEY = "medivibe_sessions";
const APP_VERSION = "v1.0.0";
const BUILD_DATE = "2026-03-13";

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
  { category: "개발 방법론", items: ["AI-Native 개발 (Vibe Coding)", "Claude Code CLI", "PRD → ROADMAP → Sprint 워크플로우"] },
];

const FEATURE_GUIDE = [
  {
    icon: "💬",
    title: "AI 건강 상담",
    steps: [
      "증상이나 궁금한 건강 정보를 자유롭게 입력하세요.",
      "AI가 의료 정보를 쉬운 말로 설명해드립니다.",
      "증상 입력 시 진료과를 자동으로 추천합니다.",
      "카카오맵·네이버지도로 근처 병원을 즉시 검색할 수 있습니다.",
      "네이버 예약으로 진료 예약까지 바로 연결됩니다.",
      "응급 상황 판단 시 119 전화 버튼이 표시됩니다.",
    ],
  },
  {
    icon: "📅",
    title: "건강기록 캘린더",
    steps: [
      "모든 상담 내용이 자동으로 저장됩니다.",
      "캘린더에서 상담한 날짜를 한눈에 확인하세요 (주황 점 표시).",
      "날짜를 클릭하면 해당일의 상담 내용을 볼 수 있습니다.",
      "과거 진료과 추천과 병원 찾기 버튼도 그대로 사용할 수 있습니다.",
    ],
  },
  {
    icon: "✏️",
    title: "새 대화 시작",
    steps: [
      "입력창 왼쪽의 ✏️ 버튼을 누르면 새 대화를 시작합니다.",
      "이전 대화는 건강기록에 자동 저장되어 언제든 다시 볼 수 있습니다.",
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
          <a href="tel:119"
            className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors col-span-2">
            🚨 119 응급 신고
          </a>
        )}
      </div>
    </div>
  );
}

// ─── 캘린더 ──────────────────────────────────────────────
function Calendar({ sessions, selectedDate, onSelectDate }: {
  sessions: HealthSession[]; selectedDate: string | null; onSelectDate: (d: string) => void;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const recordDates = new Set(sessions.map((s) => s.date));
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const toDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 font-bold">‹</button>
        <span className="font-bold text-gray-900 text-sm">{year}년 {month + 1}월</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 font-bold">›</button>
      </div>
      <div className="grid grid-cols-7 text-center py-2 border-b border-gray-100">
        {["일","월","화","수","목","금","토"].map((d, i) => (
          <span key={d} className={`text-xs font-medium ${i===0?"text-red-400":i===6?"text-blue-400":"text-gray-400"}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px p-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const dateStr = toDateStr(day);
          const hasRecord = recordDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr();
          return (
            <button key={dateStr} onClick={() => hasRecord && onSelectDate(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${!hasRecord && "cursor-default opacity-60"}`}
              style={isSelected ? { backgroundColor: UBCARE_ORANGE, color: "white" } : isToday ? { border: `1.5px solid ${UBCARE_ORANGE}`, color: UBCARE_ORANGE, fontWeight: "bold" } : {}}>
              <span className="font-medium">{day}</span>
              {hasRecord && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "white" : UBCARE_ORANGE }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 메뉴 패널 ───────────────────────────────────────────
function MenuPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"guide" | "info">("guide");
  const [openGuide, setOpenGuide] = useState<number | null>(0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white w-full max-w-xs lg:max-w-sm h-full flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        {/* 패널 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: UBCARE_ORANGE }}>
          <span className="font-bold text-white text-sm">메뉴</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white text-xl">×</button>
        </div>
        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          {[{ key: "guide", label: "📖 기능 안내" }, { key: "info", label: "ℹ️ 앱 정보" }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as "guide" | "info")}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${tab === t.key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500"}`}
              style={tab === t.key ? { borderBottomColor: UBCARE_ORANGE, color: UBCARE_ORANGE } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 기능 안내 탭 */}
          {tab === "guide" && (
            <div className="p-4 space-y-2">
              {FEATURE_GUIDE.map((g, i) => (
                <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenGuide(openGuide === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-orange-50 transition-colors">
                    <span className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      <span>{g.icon}</span>{g.title}
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

          {/* 앱 정보 탭 */}
          {tab === "info" && (
            <div className="p-4 space-y-4">
              {/* 해커톤 시연용 배너 */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-orange-700 mb-1">⚠️ 해커톤 시연용</p>
                <p className="text-xs text-orange-600">본 서비스는 유비케어 IT개발본부 해커톤 시연용으로 제작된 프로토타입이며, 실제 서비스가 아닙니다.</p>
              </div>

              {/* 버전 정보 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Image src="/ubcare-logo.png" alt="UBcare" width={80} height={24} className="object-contain" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">MediVibe AI</p>
                    <p className="text-xs text-gray-500">AI 의료 정보 도우미</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between"><span className="text-gray-400">버전</span><span className="font-mono font-semibold">{APP_VERSION}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">빌드 날짜</span><span className="font-mono">{BUILD_DATE}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">AI 모델</span><span className="font-mono text-right max-w-[55%] break-all">claude-haiku-4-5</span></div>
                </div>
              </div>

              {/* 기술 스택 */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-900 mb-3">🛠️ 개발 기술 스택</p>
                <div className="space-y-3">
                  {TECH_STACK.map((stack) => (
                    <div key={stack.category}>
                      <p className="text-xs font-semibold text-gray-500 mb-1">{stack.category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {stack.items.map((item) => (
                          <span key={item} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{item}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 저작권 */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-bold text-gray-900">📄 웹사이트 정보</p>
                <div className="text-xs text-gray-600 space-y-1.5">
                  <p><span className="font-semibold">서비스명:</span> MediVibe AI</p>
                  <p><span className="font-semibold">개발:</span> 유비케어 IT개발본부</p>
                  <p><span className="font-semibold">목적:</span> AI-Native 개발 해커톤 시연</p>
                  <p><span className="font-semibold">버전:</span> {APP_VERSION} ({BUILD_DATE})</p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-400">Copyright © UBcare Co., Ltd.<br />All rights reserved.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<"chat" | "records">("chat");
  const [menuOpen, setMenuOpen] = useState(false);

  // 채팅 상태
  const [sessionId] = useState(() => generateId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 기록 상태
  const [sessions, setSessions] = useState<HealthSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr());
  const [selectedSession, setSelectedSession] = useState<HealthSession | null>(null);

  useEffect(() => { setSessions(loadSessions()); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const persistSession = useCallback((msgs: Message[]) => {
    if (msgs.filter((m) => m.role === "user").length === 0) return;
    const firstUser = msgs.find((m) => m.role === "user")?.content ?? "상담";
    const lastSymptom = [...msgs].reverse().find((m) => m.symptomData)?.symptomData;
    const session: HealthSession = { id: sessionId, date: todayStr(), createdAt: new Date().toISOString(), title: firstUser.slice(0, 30), messages: msgs, symptomData: lastSymptom };
    saveSession(session);
    setSessions(loadSessions());
  }, [sessionId]);

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

  const sessionsOnDate = sessions.filter((s) => s.date === selectedDate);

  // ── 채팅 영역 (공통) ────────────────────────────────────
  const ChatArea = (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-5 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-16">
            <Image src="/chatbot-character.png" alt="AI 도우미" width={80} height={80} className="rounded-full" />
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
                  <Image src="/chatbot-character.png" alt="AI" width={32} height={32} className="rounded-full flex-shrink-0 mt-1 object-cover" />
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
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              className="flex-shrink-0 w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 flex items-center justify-center text-sm" title="새 대화">
              ✏️
            </button>
          )}
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

  // ── 건강기록 영역 (공통) ────────────────────────────────
  const RecordsArea = (
    <div className="h-full overflow-y-auto px-4 lg:px-8 py-5">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-base font-bold text-gray-900 mb-4">📅 나의 건강 기록</h2>
        <div className="grid lg:grid-cols-2 gap-5">
          {/* 캘린더 */}
          <div>
            <Calendar sessions={sessions} selectedDate={selectedDate} onSelectDate={(d) => { setSelectedDate(d); setSelectedSession(null); }} />
          </div>
          {/* 기록 목록 */}
          <div>
            {selectedDate && (
              <>
                <p className="text-xs text-gray-500 mb-2 font-medium">{selectedDate.replace(/-/g, ".")} 상담 기록 ({sessionsOnDate.length}건)</p>
                {sessionsOnDate.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">이 날의 상담 기록이 없습니다.</div>
                ) : (
                  <div className="space-y-2">
                    {sessionsOnDate.map((s) => (
                      <button key={s.id} onClick={() => setSelectedSession(selectedSession?.id === s.id ? null : s)}
                        className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-orange-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(s.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} · 메시지 {s.messages.length}개
                            </p>
                          </div>
                          {s.symptomData && (
                            <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${URGENCY_STYLE[s.symptomData.urgency]?.bg} ${URGENCY_STYLE[s.symptomData.urgency]?.text} ${URGENCY_STYLE[s.symptomData.urgency]?.border}`}>
                              {URGENCY_STYLE[s.symptomData.urgency]?.icon} {s.symptomData.department}
                            </span>
                          )}
                        </div>
                        {selectedSession?.id === s.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {s.messages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "text-white" : "bg-gray-100 text-gray-800"}`}
                                  style={msg.role === "user" ? { backgroundColor: UBCARE_ORANGE } : {}}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {s.symptomData && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <div className="flex flex-wrap gap-1.5">
                                  <a href={`https://map.kakao.com/?q=${encodeURIComponent(s.symptomData.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-400 text-gray-900">🗺️ 카카오맵</a>
                                  <a href={`https://map.naver.com/v5/search/${encodeURIComponent(s.symptomData.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white">🗺️ 네이버지도</a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {sessions.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm text-gray-500">아직 상담 기록이 없습니다.<br />AI 상담을 시작해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── PC 사이드바 ── */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 bg-white border-r border-gray-200 flex-shrink-0">
        {/* 로고 */}
        <div className="px-5 py-4 border-b border-gray-100">
          <Image src="/ubcare-logo.png" alt="UBcare" width={100} height={28} className="object-contain" />
          <p className="text-xs text-gray-500 mt-1">AI 의료 도우미</p>
        </div>
        {/* 네비 */}
        <nav className="flex-1 p-3 space-y-1">
          {[
            { key: "chat", icon: "💬", label: "AI 건강 상담" },
            { key: "records", icon: "📅", label: "건강기록" },
          ].map((item) => (
            <button key={item.key}
              onClick={() => { setView(item.key as "chat" | "records"); if (item.key === "records") setSessions(loadSessions()); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view === item.key ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={view === item.key ? { backgroundColor: UBCARE_ORANGE } : {}}>
              <span className="text-base">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        {/* 하단 정보 */}
        <div className="p-4 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
          <p className="font-semibold text-gray-500">MediVibe AI {APP_VERSION}</p>
          <p>Copyright © UBcare Co., Ltd.</p>
          <p className="text-orange-500 font-medium">⚠️ 해커톤 시연용</p>
        </div>
      </aside>

      {/* ── 메인 영역 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          {/* 모바일: 로고 표시 / PC: 현재 뷰 타이틀 */}
          <div className="lg:hidden">
            <Image src="/ubcare-logo.png" alt="UBcare" width={90} height={26} className="object-contain" />
          </div>
          <span className="hidden lg:block text-sm font-bold text-gray-900">
            {view === "chat" ? "💬 AI 건강 상담" : "📅 건강기록"}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">온라인</span>
            </div>
            {/* 메뉴 버튼 (⋮) */}
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
          {view === "chat" ? ChatArea : RecordsArea}
        </div>

        {/* 모바일 하단 네비 */}
        <nav className="lg:hidden bg-white border-t border-gray-200 flex flex-shrink-0">
          {[
            { key: "chat", icon: "💬", label: "AI 상담" },
            { key: "records", icon: "📅", label: "건강기록" },
          ].map((item) => (
            <button key={item.key}
              onClick={() => { setView(item.key as "chat" | "records"); if (item.key === "records") setSessions(loadSessions()); }}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${view === item.key ? "" : "text-gray-400"}`}
              style={view === item.key ? { color: UBCARE_ORANGE } : {}}>
              <span className="text-lg">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 메뉴 패널 */}
      {menuOpen && <MenuPanel onClose={() => setMenuOpen(false)} />}
    </div>
  );
}
