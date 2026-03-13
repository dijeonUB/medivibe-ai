"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── 타입 정의 ───────────────────────────────────────────
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
  date: string;       // YYYY-MM-DD
  createdAt: string;  // ISO
  title: string;      // 첫 번째 사용자 메시지 (30자)
  messages: Message[];
  symptomData?: SymptomData;
}

// ─── 상수 ────────────────────────────────────────────────
const UBCARE_ORANGE = "#ec6120";
const STORAGE_KEY = "medivibe_sessions";

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

// ─── 유틸 ────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function parseSymptomData(text: string): { clean: string; symptomData?: SymptomData } {
  const match = text.match(/\[SYMPTOM_DATA\]([\s\S]*?)\[\/SYMPTOM_DATA\]/);
  if (!match) return { clean: text.trim() };
  try {
    const symptomData: SymptomData = JSON.parse(match[1].trim());
    const clean = text.replace(/\[SYMPTOM_DATA\][\s\S]*?\[\/SYMPTOM_DATA\]/g, "").trim();
    return { clean, symptomData };
  } catch {
    return { clean: text.replace(/\[SYMPTOM_DATA\][\s\S]*?\[\/SYMPTOM_DATA\]/g, "").trim() };
  }
}

// ─── 로컬스토리지 ─────────────────────────────────────────
function loadSessions(): HealthSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}
function saveSession(session: HealthSession) {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ─── SVG 로고 ─────────────────────────────────────────────
function UBCareLogo() {
  return (
    <svg width="120" height="30" viewBox="0 0 120 30" fill="none">
      <rect x="1" y="9" width="18" height="12" rx="2" fill={UBCARE_ORANGE} />
      <rect x="5" y="5" width="10" height="20" rx="2" fill={UBCARE_ORANGE} />
      <text x="26" y="21" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="15" fill={UBCARE_ORANGE}>유비케어</text>
    </svg>
  );
}

// ─── 인라인 병원 찾기 카드 ────────────────────────────────
function HospitalCard({ data }: { data: SymptomData }) {
  const s = URGENCY_STYLE[data.urgency] ?? URGENCY_STYLE["일반"];
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className={`px-4 py-2 flex items-center gap-2 ${s.bg} border-b ${s.border}`}>
        <span>{s.icon}</span>
        <span className={`font-semibold text-sm ${s.text}`}>추천 진료과: {data.department}</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${s.bg} ${s.text} ${s.border}`}>{data.urgency}</span>
      </div>
      {data.urgencyReason && (
        <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">{data.urgencyReason}</p>
      )}
      <div className="p-3 grid grid-cols-2 gap-2">
        <a
          href={`https://map.kakao.com/?q=${encodeURIComponent(data.searchKeyword)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-colors"
        >
          🗺️ 카카오맵
        </a>
        <a
          href={`https://map.naver.com/v5/search/${encodeURIComponent(data.searchKeyword)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
        >
          🗺️ 네이버지도
        </a>
        <a
          href={`https://booking.naver.com/booking/13/bizes?serviceType=1&keywords=${encodeURIComponent(data.department)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors col-span-2"
          style={{ backgroundColor: "#03c75a" }}
        >
          📅 네이버 예약으로 진료 예약
        </a>
        {data.urgency === "응급" && (
          <a href="tel:119"
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors col-span-2"
          >
            🚨 119 응급 신고
          </a>
        )}
      </div>
    </div>
  );
}

// ─── 캘린더 컴포넌트 ──────────────────────────────────────
function Calendar({
  sessions,
  selectedDate,
  onSelectDate,
}: {
  sessions: HealthSession[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const recordDates = new Set(sessions.map((s) => s.date));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const toDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">‹</button>
        <span className="font-bold text-gray-900 text-sm">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">›</button>
      </div>
      {/* 요일 */}
      <div className="grid grid-cols-7 text-center py-2 border-b border-gray-100">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <span key={d} className={`text-xs font-medium ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>{d}</span>
        ))}
      </div>
      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-px p-2">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const dateStr = toDateStr(day);
          const hasRecord = recordDates.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr();
          return (
            <button
              key={dateStr}
              onClick={() => hasRecord && onSelectDate(dateStr)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all
                ${isSelected ? "text-white" : hasRecord ? "text-gray-900 hover:bg-orange-50" : "text-gray-400"}
                ${!hasRecord && "cursor-default"}
              `}
              style={isSelected ? { backgroundColor: UBCARE_ORANGE } : isToday && !isSelected ? { border: `1.5px solid ${UBCARE_ORANGE}`, color: UBCARE_ORANGE } : {}}
            >
              <span className="font-medium">{day}</span>
              {hasRecord && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? "bg-white" : ""}`}
                  style={!isSelected ? { backgroundColor: UBCARE_ORANGE } : {}} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<"chat" | "records">("chat");

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

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 세션 저장
  const persistSession = useCallback(
    (msgs: Message[]) => {
      if (msgs.filter((m) => m.role === "user").length === 0) return;
      const firstUser = msgs.find((m) => m.role === "user")?.content ?? "상담";
      const lastSymptom = [...msgs].reverse().find((m) => m.symptomData)?.symptomData;
      const session: HealthSession = {
        id: sessionId,
        date: todayStr(),
        createdAt: new Date().toISOString(),
        title: firstUser.slice(0, 30),
        messages: msgs,
        symptomData: lastSymptom,
      };
      saveSession(session);
      setSessions(loadSessions());
    },
    [sessionId]
  );

  // 메시지 전송
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("API 오류");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트림 오류");
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        // 스트리밍 중에도 [SYMPTOM_DATA] 블록은 화면에 숨김
        const displayText = fullText.replace(/\[SYMPTOM_DATA\][\s\S]*?(\[\/SYMPTOM_DATA\]|$)/g, "").trim();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: displayText };
          return updated;
        });
      }

      // 스트리밍 완료 후 symptomData 파싱 및 최종 정리
      const { clean, symptomData } = parseSymptomData(fullText);
      const finalMessages: Message[] = [
        ...nextMessages,
        { role: "assistant", content: clean, symptomData },
      ];
      setMessages(finalMessages);
      persistSession(finalMessages);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sessionsOnDate = sessions.filter((s) => s.date === selectedDate);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <UBCareLogo />
        <div className="h-5 w-px bg-gray-200" />
        <span className="text-sm font-semibold text-gray-700">AI 의료 도우미</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">온라인</span>
        </div>
      </header>

      {/* ── 콘텐츠 ── */}
      <div className="flex-1 overflow-hidden">

        {/* ====== 채팅 뷰 ====== */}
        {view === "chat" && (
          <div className="flex flex-col h-full">
            <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-5 pb-16">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#fff0e8" }}>
                    <span className="text-3xl">💊</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">무엇이 불편하신가요?</h2>
                    <p className="text-gray-600 text-sm">
                      증상을 말씀하시면 <span className="font-semibold" style={{ color: UBCARE_ORANGE }}>진료과 안내</span>와{" "}
                      <span className="font-semibold" style={{ color: UBCARE_ORANGE }}>근처 병원</span>까지 바로 연결해드려요.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all shadow-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-white text-xs"
                          style={{ backgroundColor: UBCARE_ORANGE }}>⚕</div>
                      )}
                      <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "text-white rounded-br-sm"
                              : "bg-white border border-gray-200 shadow-sm rounded-bl-sm text-gray-900"
                          }`}
                          style={msg.role === "user" ? { backgroundColor: UBCARE_ORANGE } : {}}
                        >
                          {msg.content === "" && isLoading && idx === messages.length - 1 ? (
                            <span className="inline-flex gap-1 py-0.5">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </span>
                          ) : msg.content}
                        </div>
                        {/* 증상 감지 시 병원 찾기 카드 인라인 표시 */}
                        {msg.role === "assistant" && msg.symptomData && (
                          <HospitalCard data={msg.symptomData} />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </main>

            {/* 면책 고지 */}
            <div className="bg-amber-50 border-t border-amber-100 px-4 py-1 text-center flex-shrink-0">
              <p className="text-xs text-amber-700">⚠️ 이 서비스는 정보 제공 목적입니다. 실제 진료는 의료 전문가에게 받으세요.</p>
            </div>

            {/* 입력창 */}
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
              <div className="flex gap-2 items-end max-w-2xl mx-auto">
                {messages.length > 0 && (
                  <button
                    onClick={() => { setMessages([]); }}
                    className="flex-shrink-0 w-9 h-9 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 flex items-center justify-center text-base"
                    title="새 대화"
                  >✏️</button>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="증상이나 건강 질문을 입력하세요..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-9 h-9 text-white rounded-xl flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  style={{ backgroundColor: input.trim() && !isLoading ? UBCARE_ORANGE : undefined }}
                >
                  {isLoading ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== 건강 기록 뷰 ====== */}
        {view === "records" && (
          <div className="h-full overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto w-full">
            <h2 className="text-base font-bold text-gray-900">📅 나의 건강 기록</h2>

            {/* 캘린더 */}
            <Calendar
              sessions={sessions}
              selectedDate={selectedDate}
              onSelectDate={(d) => { setSelectedDate(d); setSelectedSession(null); }}
            />

            {/* 선택된 날짜의 세션 목록 */}
            {selectedDate && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  {selectedDate.replace(/-/g, ".")} 상담 기록 ({sessionsOnDate.length}건)
                </p>
                {sessionsOnDate.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
                    이 날의 상담 기록이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessionsOnDate.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSession(selectedSession?.id === s.id ? null : s)}
                        className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-orange-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(s.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                              {" · "}메시지 {s.messages.length}개
                            </p>
                          </div>
                          {s.symptomData && (
                            <span className={`ml-2 flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium
                              ${URGENCY_STYLE[s.symptomData.urgency]?.bg}
                              ${URGENCY_STYLE[s.symptomData.urgency]?.text}
                              ${URGENCY_STYLE[s.symptomData.urgency]?.border}`}>
                              {URGENCY_STYLE[s.symptomData.urgency]?.icon} {s.symptomData.department}
                            </span>
                          )}
                        </div>

                        {/* 펼치면 대화 내용 표시 */}
                        {selectedSession?.id === s.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {s.messages.map((msg, i) => (
                              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                    msg.role === "user" ? "text-white" : "bg-gray-100 text-gray-800"
                                  }`}
                                  style={msg.role === "user" ? { backgroundColor: UBCARE_ORANGE } : {}}
                                >
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                            {s.symptomData && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-1.5 font-medium">병원 찾기</p>
                                <div className="flex flex-wrap gap-1.5">
                                  <a href={`https://map.kakao.com/?q=${encodeURIComponent(s.symptomData.searchKeyword)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-400 text-gray-900">
                                    🗺️ 카카오맵
                                  </a>
                                  <a href={`https://map.naver.com/v5/search/${encodeURIComponent(s.symptomData.searchKeyword)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 text-white">
                                    🗺️ 네이버지도
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sessions.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-2xl mb-2">💬</p>
                <p className="text-sm text-gray-500">아직 상담 기록이 없습니다.<br />AI 상담을 시작해보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 하단 네비게이션 ── */}
      <nav className="bg-white border-t border-gray-200 flex flex-shrink-0">
        <button
          onClick={() => setView("chat")}
          className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
            view === "chat" ? "text-orange-600" : "text-gray-400"
          }`}
          style={view === "chat" ? { color: UBCARE_ORANGE } : {}}
        >
          <span className="text-lg">💬</span>
          AI 상담
        </button>
        <button
          onClick={() => { setView("records"); setSessions(loadSessions()); }}
          className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
            view === "records" ? "text-orange-600" : "text-gray-400"
          }`}
          style={view === "records" ? { color: UBCARE_ORANGE } : {}}
        >
          <span className="text-lg">📅</span>
          건강기록
          {sessions.length > 0 && (
            <span className="absolute mt-0.5 -mr-4 w-1.5 h-1.5 rounded-full bg-orange-500" style={{ marginTop: "-12px", marginLeft: "18px" }} />
          )}
        </button>
      </nav>
    </div>
  );
}
