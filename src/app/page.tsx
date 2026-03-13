"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SymptomResult {
  department: string;
  departmentEng: string;
  reason: string;
  urgency: "일반" | "주의" | "응급";
  urgencyReason: string;
  cautions: string[];
  searchKeyword: string;
}

const QUICK_QUESTIONS = [
  "고혈압이란 무엇인가요?",
  "당뇨병 초기 증상이 궁금해요",
  "콜레스테롤 수치가 높으면 어떻게 되나요?",
  "MRI와 CT의 차이점이 뭔가요?",
  "면역력을 높이는 방법은?",
];

// UBCare 브랜드 색상
const UBCARE_ORANGE = "#ec6120";

// 긴급도별 스타일
const URGENCY_STYLE = {
  일반: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", icon: "✅" },
  주의: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", icon: "⚠️" },
  응급: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", icon: "🚨" },
};

// 유비케어 SVG 로고
function UBCareLogo() {
  return (
    <svg width="110" height="32" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 십자 아이콘 */}
      <rect x="0" y="10" width="20" height="12" rx="2" fill={UBCARE_ORANGE} />
      <rect x="4" y="6" width="12" height="20" rx="2" fill={UBCARE_ORANGE} />
      {/* 텍스트 */}
      <text x="26" y="22" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="15" fill={UBCARE_ORANGE}>유비케어</text>
    </svg>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "symptom">("chat");

  // 채팅 탭 상태
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 증상 분석 탭 상태
  const [symptoms, setSymptoms] = useState("");
  const [symptomResult, setSymptomResult] = useState<SymptomResult | null>(null);
  const [isSymptomLoading, setIsSymptomLoading] = useState(false);
  const [symptomError, setSymptomError] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 채팅 전송
  const sendMessage = async (text: string) => {
    if (!text.trim() || isChatLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("API 오류");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("스트림 오류");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." };
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  // 증상 분석
  const analyzeSymptoms = async () => {
    if (!symptoms.trim() || isSymptomLoading) return;
    setIsSymptomLoading(true);
    setSymptomResult(null);
    setSymptomError("");

    try {
      const response = await fetch("/api/symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "분석 오류");
      setSymptomResult(data);
    } catch (e) {
      setSymptomError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setIsSymptomLoading(false);
    }
  };

  // 병원 검색 링크 생성
  const openKakaoMap = (keyword: string) => {
    window.open(`https://map.kakao.com/?q=${encodeURIComponent(keyword)}`, "_blank");
  };
  const openNaverMap = (keyword: string) => {
    window.open(`https://map.naver.com/v5/search/${encodeURIComponent(keyword)}`, "_blank");
  };
  const openNaverBooking = (department: string) => {
    window.open(`https://booking.naver.com/booking/13/bizes?serviceType=1&keywords=${encodeURIComponent(department)}`, "_blank");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <UBCareLogo />
        <div className="h-6 w-px bg-gray-200" />
        <div>
          <p className="text-sm font-semibold text-gray-700">AI 의료 도우미</p>
          <p className="text-xs text-gray-400">MediVibe AI</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-500">온라인</span>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200 flex">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === "chat"
              ? "border-b-2 text-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={activeTab === "chat" ? { borderBottomColor: UBCARE_ORANGE, color: UBCARE_ORANGE } : {}}
        >
          💬 AI 건강 상담
        </button>
        <button
          onClick={() => setActiveTab("symptom")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === "symptom"
              ? "border-b-2"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={activeTab === "symptom" ? { borderBottomColor: UBCARE_ORANGE, color: UBCARE_ORANGE } : {}}
        >
          🏥 증상 분석 & 병원 찾기
        </button>
      </div>

      {/* ─── 채팅 탭 ─── */}
      {activeTab === "chat" && (
        <>
          <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6 pb-20">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "#fef0e8" }}>
                  <span className="text-4xl">💊</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">무엇이 궁금하신가요?</h2>
                  <p className="text-gray-600 text-sm max-w-sm">
                    의료 용어, 건강 정보에 대해 쉽게 설명해드립니다.
                    <br />
                    <span className="font-semibold" style={{ color: UBCARE_ORANGE }}>아래 예시 질문</span>을 눌러 시작하거나 직접 입력하세요.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm"
                      style={{ color: "#374151" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = UBCARE_ORANGE; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
                    >
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
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: UBCARE_ORANGE }}>
                        <span className="text-white text-sm">⚕</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-white border border-gray-200 shadow-sm rounded-bl-sm text-gray-900"
                      }`}
                      style={msg.role === "user" ? { backgroundColor: UBCARE_ORANGE } : {}}
                    >
                      {msg.content === "" && isChatLoading ? (
                        <span className="inline-flex gap-1 py-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                        </span>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </main>

          <div className="bg-amber-50 border-t border-amber-100 px-4 py-1.5 text-center">
            <p className="text-xs text-amber-700">⚠️ 이 서비스는 정보 제공 목적입니다. 실제 진료는 의료 전문가에게 받으세요.</p>
          </div>

          <div className="bg-white border-t border-gray-200 px-4 py-3">
            <div className="flex gap-2 items-end max-w-3xl mx-auto">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); } }}
                placeholder="건강 관련 질문을 입력하세요... (Enter로 전송)"
                rows={1}
                className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": UBCARE_ORANGE } as React.CSSProperties}
                disabled={isChatLoading}
              />
              <button
                onClick={() => sendMessage(chatInput)}
                disabled={!chatInput.trim() || isChatLoading}
                className="w-10 h-10 text-white rounded-xl flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                style={{ backgroundColor: chatInput.trim() && !isChatLoading ? UBCARE_ORANGE : undefined }}
              >
                {isChatLoading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── 증상 분석 탭 ─── */}
      {activeTab === "symptom" && (
        <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
          {/* 증상 입력 카드 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span style={{ color: UBCARE_ORANGE }}>🩺</span> 증상을 입력해주세요
            </h2>
            <p className="text-xs text-gray-500 mb-3">증상을 자세히 설명할수록 더 정확한 진료과를 추천받을 수 있습니다.</p>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="예) 3일 전부터 목이 따끔따끔하고 열이 38도 이상 납니다. 기침도 심하고 몸살 기운이 있어요."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none"
            />
            <button
              onClick={analyzeSymptoms}
              disabled={!symptoms.trim() || isSymptomLoading}
              className="mt-3 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: symptoms.trim() && !isSymptomLoading ? UBCARE_ORANGE : undefined }}
            >
              {isSymptomLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI 분석 중...
                </>
              ) : (
                <>🔍 진료과 분석하기</>
              )}
            </button>
          </div>

          {/* 오류 */}
          {symptomError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
              ❌ {symptomError}
            </div>
          )}

          {/* 분석 결과 */}
          {symptomResult && (
            <div className="space-y-4">
              {/* 진료과 + 긴급도 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">추천 진료과</p>
                    <h3 className="text-2xl font-bold text-gray-900">{symptomResult.department}</h3>
                    <p className="text-sm text-gray-500">{symptomResult.departmentEng}</p>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${URGENCY_STYLE[symptomResult.urgency]?.bg} ${URGENCY_STYLE[symptomResult.urgency]?.text} ${URGENCY_STYLE[symptomResult.urgency]?.border}`}
                  >
                    {URGENCY_STYLE[symptomResult.urgency]?.icon} {symptomResult.urgency}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-2">{symptomResult.reason}</p>
                <p className="text-xs text-gray-500 italic">{symptomResult.urgencyReason}</p>
              </div>

              {/* 주의사항 */}
              {symptomResult.cautions.length > 0 && (
                <div className="bg-orange-50 rounded-2xl border border-orange-200 p-4">
                  <p className="text-sm font-semibold text-orange-800 mb-2">📋 주의사항</p>
                  <ul className="space-y-1">
                    {symptomResult.cautions.map((c, i) => (
                      <li key={i} className="text-sm text-orange-700 flex gap-2">
                        <span className="text-orange-400 flex-shrink-0">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 병원 찾기 버튼 */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <p className="text-sm font-bold text-gray-900 mb-3">🏥 근처 병원 찾기</p>
                <div className="space-y-2">
                  <button
                    onClick={() => openKakaoMap(symptomResult.searchKeyword)}
                    className="w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-between bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">🗺️</span> 카카오맵으로 병원 찾기
                    </span>
                    <span className="text-xs opacity-70">→ {symptomResult.searchKeyword}</span>
                  </button>
                  <button
                    onClick={() => openNaverMap(symptomResult.searchKeyword)}
                    className="w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-between bg-green-500 hover:bg-green-600 text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">🗺️</span> 네이버지도로 병원 찾기
                    </span>
                    <span className="text-xs opacity-70">→ {symptomResult.searchKeyword}</span>
                  </button>
                  <button
                    onClick={() => openNaverBooking(symptomResult.department)}
                    className="w-full py-3 px-4 rounded-xl text-sm font-medium flex items-center justify-between text-white transition-colors"
                    style={{ backgroundColor: "#03c75a" }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">📅</span> 네이버 예약으로 예약하기
                    </span>
                    <span className="text-xs opacity-70">→ {symptomResult.department}</span>
                  </button>
                  {symptomResult.urgency === "응급" && (
                    <button
                      onClick={() => window.location.href = "tel:119"}
                      className="w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      🚨 119 응급 신고
                    </button>
                  )}
                </div>
              </div>

              {/* 초기화 버튼 */}
              <button
                onClick={() => { setSymptomResult(null); setSymptoms(""); }}
                className="w-full py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                다시 분석하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
