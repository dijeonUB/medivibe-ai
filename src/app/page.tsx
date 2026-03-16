"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

import { ViewType, HealthSession } from "@/types";
import { UBCARE_ORANGE, APP_VERSION, QUICK_QUESTIONS } from "@/constants";
import { useChat } from "@/hooks/useChat";
import { useRecords } from "@/hooks/useRecords";
import { MediQIcon, PulseIcon, CalendarIcon, PillIcon, NewsIcon, InsightIcon, EditIcon, TrashIcon, SearchIcon } from "@/components/icons";
import ConfirmDialog from "@/components/ConfirmDialog";
import HospitalCard from "@/components/HospitalCard";
import Calendar from "@/components/Calendar";
import SessionCard from "@/components/SessionCard";
import SupplementsView from "@/components/SupplementsView";
import NewsView from "@/components/NewsView";
import InsightView from "@/components/InsightView";
import MorningBriefing from "@/components/MorningBriefing";
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
    { key: "chat" as ViewType,        icon: (cls: string) => <PulseIcon className={cls} />,     labelLong: "AI 건강 상담",   labelShort: "AI 상담" },
    { key: "records" as ViewType,     icon: (cls: string) => <CalendarIcon className={cls} />,  labelLong: "건강기록",       labelShort: "건강기록" },
    { key: "insight" as ViewType,     icon: (cls: string) => <InsightIcon className={cls} />,   labelLong: "건강 이력 분석", labelShort: "리포트" },
    { key: "supplements" as ViewType, icon: (cls: string) => <PillIcon className={cls} />,      labelLong: "건강식품 추천",  labelShort: "건기식" },
    { key: "news" as ViewType,        icon: (cls: string) => <NewsIcon className={cls} />,      labelLong: "건강뉴스",       labelShort: "뉴스" },
  ];

  const trimmedQuery = searchQuery.trim();

  // ── 채팅 영역 (ChatGPT + Notion + Vercel 리디자인) ────
  const ChatArea = (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f9fafb" }}>

      {/* ── 메시지 스크롤 영역 ── */}
      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (

          /* ── 빈 상태: Vercel 히어로 + Notion 기능 카드 ── */
          <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col items-center gap-7">

            {/* 아이콘 + 타이틀 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-orange-100 shadow-md mx-auto mb-4">
                <Image src="/chatbot-character.jpg" alt="MediQ" width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1.5">무엇을 도와드릴까요?</h1>
              <p className="text-sm text-gray-500">증상 분석부터 건강 리포트까지, AI가 함께합니다.</p>
            </div>

            {/* 아침 브리핑 */}
            <MorningBriefing />

            {/* Notion 스타일 기능 카드 3열 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <button onClick={() => sendMessage("두통이 3일째 계속되고 있어요")}
                className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "#fff3eb" }}>
                  <PulseIcon className="w-4 h-4" style={{ color: UBCARE_ORANGE }} />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">증상 분석</p>
                <p className="text-xs text-gray-400 leading-relaxed">증상을 말씀하시면 진료과와 근처 병원을 안내해드려요</p>
              </button>

              <button onClick={() => sendMessage("처방전에 있는 약의 성분과 복용 주의사항을 알려주세요")}
                className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "#fff3eb" }}>
                  <PillIcon className="w-4 h-4" style={{ color: UBCARE_ORANGE }} />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">처방전 분석</p>
                <p className="text-xs text-gray-400 leading-relaxed">복용 중인 약의 성분·효능·주의사항을 쉽게 설명해드려요</p>
              </button>

              <button onClick={() => setView("insight")}
                className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all text-left">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "#fff3eb" }}>
                  <InsightIcon className="w-4 h-4" style={{ color: UBCARE_ORANGE }} />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">건강 리포트</p>
                <p className="text-xs text-gray-400 leading-relaxed">상담 이력을 AI가 분석해 건강 패턴을 리포트로 보여드려요</p>
              </button>
            </div>

            {/* 빠른 질문 chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_QUESTIONS.map((q) => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-500 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm">
                  {q}
                </button>
              ))}
            </div>
          </div>

        ) : (

          /* ── 메시지: ChatGPT 스타일 ── */
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5 shadow-sm border border-orange-100">
                    <Image src="/chatbot-character.jpg" alt="MediQ" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`flex flex-col gap-1.5 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {msg.role === "assistant" && (
                    <span className="text-[11px] font-semibold text-gray-400 px-1 tracking-wide">MediQ</span>
                  )}
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap px-4 py-3 ${
                    msg.role === "user"
                      ? "text-white rounded-2xl rounded-br-sm shadow-sm"
                      : "text-gray-800 bg-white rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm"
                  }`} style={msg.role === "user" ? { backgroundColor: UBCARE_ORANGE } : {}}>
                    {msg.content === "" && isLoading && idx === messages.length - 1 ? (
                      <span className="inline-flex gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : msg.content}
                  </div>
                  {msg.role === "assistant" && msg.symptomData && <HospitalCard data={msg.symptomData} />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* ── 입력 영역 ── */}
      <div className="px-4 pt-2 pb-4 flex-shrink-0" style={{ backgroundColor: "#f9fafb" }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm transition-all focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="증상이나 건강 질문을 입력하세요…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              disabled={isLoading} />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:bg-gray-200 disabled:cursor-not-allowed transition-all flex-shrink-0"
              style={{ backgroundColor: input.trim() && !isLoading ? UBCARE_ORANGE : undefined }}>
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
          <p className="text-center text-[11px] text-gray-400 mt-2 tracking-tight">
            정보 제공 목적이며 실제 진료는 의료 전문가에게 받으세요.
          </p>
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
    <div className="flex h-[100dvh] bg-gray-50 overflow-hidden">
      {/* ── PC 사이드바 (Vercel 스타일) ── */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-60 bg-white border-r border-gray-100 flex-shrink-0">
        {/* 브랜드 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: UBCARE_ORANGE }}>
              <MediQIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight text-gray-900">MediQ</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 ml-9 tracking-wide">Your Health Intelligence</p>
        </div>

        {/* 새 대화 버튼 */}
        {view === "chat" && (
          <div className="px-3 pt-3">
            <button onClick={startNewChat}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: UBCARE_ORANGE, color: "#fff" }}>
              <EditIcon className="w-3.5 h-3.5" />새 대화
            </button>
          </div>
        )}

        {/* 네비 */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto mt-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.key}
              data-tutorial={`nav-${item.key}`}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                view === item.key
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}>
              {item.icon("w-4 h-4")}
              {item.labelLong}
            </button>
          ))}
        </nav>

        {/* 하단 정보 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400">MediQ {APP_VERSION}</p>
          <p className="text-[10px] text-gray-300 mt-0.5">© UBcare Co., Ltd.</p>
        </div>
      </aside>

      {/* ── 메인 영역 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 h-12 flex items-center flex-shrink-0">
          {/* 모바일 로고 */}
          <div className="lg:hidden flex-1 flex justify-center items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: UBCARE_ORANGE }}>
              <MediQIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">MediQ</span>
          </div>
          {/* PC 현재 탭 이름 */}
          <div className="hidden lg:flex items-center gap-2 text-sm font-semibold text-gray-700 flex-1">
            {NAV_ITEMS.find((n) => n.key === view)?.icon("w-4 h-4")}
            {NAV_ITEMS.find((n) => n.key === view)?.labelLong}
          </div>
          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              온라인
            </span>
            {view === "chat" && (
              <button onClick={startNewChat}
                className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-colors"
                style={{ color: UBCARE_ORANGE }}
                title="새 대화 시작">
                <EditIcon className="w-4 h-4" />
              </button>
            )}
            <button data-tutorial="menu-btn" onClick={() => setMenuOpen(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="3" r="1.5" fill="currentColor" />
                <circle cx="9" cy="9" r="1.5" fill="currentColor" />
                <circle cx="9" cy="15" r="1.5" fill="currentColor" />
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
          <div className="h-full" style={{ display: view === "insight" ? "block" : "none" }}>
            <InsightView />
          </div>
        </div>

        <nav className="lg:hidden bg-white border-t border-gray-100 flex flex-shrink-0">
          {NAV_ITEMS.map((item) => (
            <button key={item.key}
              data-tutorial={`nav-${item.key}`}
              onClick={() => setView(item.key)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors ${
                view === item.key ? "text-orange-500" : "text-gray-400"
              }`}>
              {item.icon("w-5 h-5")}
              <span className="text-[9px] font-medium">{item.labelShort}</span>
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
