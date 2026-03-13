"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

import { ViewType, HealthSession } from "@/types";
import { UBCARE_ORANGE, APP_VERSION, QUICK_QUESTIONS } from "@/constants";
import { useChat } from "@/hooks/useChat";
import { useRecords } from "@/hooks/useRecords";
import { PulseIcon, CalendarIcon, PillIcon, NewsIcon, EditIcon, TrashIcon, SearchIcon } from "@/components/icons";
import ConfirmDialog from "@/components/ConfirmDialog";
import HospitalCard from "@/components/HospitalCard";
import Calendar from "@/components/Calendar";
import SessionCard from "@/components/SessionCard";
import SupplementsView from "@/components/SupplementsView";
import NewsView from "@/components/NewsView";
import MenuPanel from "@/components/MenuPanel";
import TutorialOverlay from "@/components/TutorialOverlay";

const TUTORIAL_KEY = "medivibe_tutorial_seen_v1";

// ─── 메인 ────────────────────────────────────────────────
export default function Home() {
  const [view, setView] = useState<ViewType>("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // 채팅 상태 및 액션 (커스텀 훅)
  const {
    messages, input, isLoading, setInput,
    sendMessage, startNewChat, loadSession, messagesEndRef,
  } = useChat();

  // 건강기록 상태 및 액션 (커스텀 훅)
  const {
    sessions,
    selectedDate, setSelectedDate,
    selectedSession, setSelectedSession,
    calendarMonth, setCalendarMonth,
    searchQuery, setSearchQuery,
    displaySessions,
    confirmDialog, setConfirmDialog,
    handleDeleteSession, handleDeleteMonth, handleDeleteAll,
  } = useRecords();

  // 첫 방문 시 튜토리얼 자동 표시
  useEffect(() => {
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      const t = setTimeout(() => setShowTutorial(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const handleTutorialClose = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setShowTutorial(false);
  }, []);

  const handleContinueSession = useCallback(
    (session: HealthSession) => {
      loadSession(session);
      setView("chat");
      window.scrollTo(0, 0);
    },
    [loadSession]
  );

  // ── 네비 아이템 ───────────────────────────────────────
  const NAV_ITEMS = [
    { key: "chat" as ViewType,        icon: (cls: string) => <PulseIcon className={cls} />,    labelLong: "AI 건강 상담",  labelShort: "AI 상담" },
    { key: "records" as ViewType,     icon: (cls: string) => <CalendarIcon className={cls} />, labelLong: "건강기록",      labelShort: "건강기록" },
    { key: "supplements" as ViewType, icon: (cls: string) => <PillIcon className={cls} />,     labelLong: "건강식품 추천", labelShort: "건기식" },
    { key: "news" as ViewType,        icon: (cls: string) => <NewsIcon className={cls} />,     labelLong: "건강뉴스",      labelShort: "뉴스" },
  ];

  const trimmedQuery = searchQuery.trim();

  // ── 채팅 영역 ─────────────────────────────────────────
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

  // ── 건강기록 영역 ──────────────────────────────────────
  const RecordsArea = (
    <div className="h-full overflow-hidden flex flex-col">
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

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="lg:w-[360px] xl:w-[400px] flex-shrink-0 overflow-y-auto px-4 pt-4 pb-4 lg:border-r border-gray-200 bg-white">
          <Calendar
            sessions={sessions}
            selectedDate={selectedDate}
            onSelectDate={(d) => { setSelectedDate(d); setSelectedSession(null); setSearchQuery(""); }}
            onViewMonthChange={(y, m) => setCalendarMonth({ year: y, month: m })}
          />
          <div className="lg:hidden mt-4 border-t border-gray-200" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
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
              data-tutorial={`nav-${item.key}`}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${view === item.key ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={view === item.key ? { backgroundColor: UBCARE_ORANGE } : {}}>
              {item.icon("w-5 h-5")}{item.labelLong}
            </button>
          ))}
        </nav>

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
            <button data-tutorial="menu-btn" onClick={() => setMenuOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="3" r="1.5" fill="#6b7280" />
                <circle cx="9" cy="9" r="1.5" fill="#6b7280" />
                <circle cx="9" cy="15" r="1.5" fill="#6b7280" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {view === "chat" && ChatArea}
          {view === "records" && RecordsArea}
          <div className="h-full" style={{ display: view === "supplements" ? "block" : "none" }}>
            <SupplementsView />
          </div>
          <div className="h-full" style={{ display: view === "news" ? "block" : "none" }}>
            <NewsView />
          </div>
        </div>

        <nav className="lg:hidden bg-white border-t border-gray-200 flex flex-shrink-0">
          {NAV_ITEMS.map((item) => (
            <button key={item.key}
              data-tutorial={`nav-${item.key}`}
              onClick={() => setView(item.key)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 font-medium transition-colors ${view === item.key ? "" : "text-gray-400"}`}
              style={view === item.key ? { color: UBCARE_ORANGE } : {}}>
              {item.icon("w-5 h-5")}
              <span className="text-[10px]">{item.labelShort}</span>
            </button>
          ))}
        </nav>
      </div>

      {menuOpen && (
        <MenuPanel
          onClose={() => setMenuOpen(false)}
          onStartTutorial={() => { setMenuOpen(false); setTimeout(() => setShowTutorial(true), 150); }}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
      <TutorialOverlay isVisible={showTutorial} onClose={handleTutorialClose} />
    </div>
  );
}
