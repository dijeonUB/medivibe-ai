"use client";

// ─── 메뉴 패널 (슬라이드 오버) ───────────────────────────

import { useState } from "react";
import { UBCARE_ORANGE, APP_VERSION, BUILD_DATE, FEEDBACK_EMAIL, TECH_STACK, UPDATE_HISTORY } from "@/constants";
import { MediQIcon, CalendarIcon, PillIcon, NewsIcon, InsightIcon, PulseIcon } from "@/components/icons";

// 기능 가이드 — 아이콘 컴포넌트에 의존하므로 컴포넌트 내부에서 정의
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
  {
    icon: <InsightIcon className="w-4 h-4" />,
    title: "건강 이력 분석",
    steps: [
      "전체 상담 이력을 AI가 분석하여 개인 건강 패턴을 파악합니다.",
      "반복 키워드, 자주 방문하는 진료과, 월평균 상담 횟수를 확인하세요.",
      "이력 기반 개인화 건강 추천사항도 함께 제공됩니다.",
      "분석 결과는 월 1회 자동 캐시되어 빠르게 조회됩니다.",
    ],
  },
  {
    icon: <span className="text-sm">☀️</span>,
    title: "아침 건강 브리핑",
    steps: [
      "AI 건강 상담 탭의 빈 화면 상단에 매일 아침 브리핑 카드가 표시됩니다.",
      "최근 3일 상담 내역을 바탕으로 개인화된 오늘의 건강 조언을 제공합니다.",
      "↺ 버튼으로 브리핑을 즉시 새로 생성할 수 있습니다.",
    ],
  },
];

const TABS = [
  { key: "guide", label: "기능 안내" },
  { key: "updates", label: "업데이트" },
  { key: "info", label: "앱 정보" },
  { key: "feedback", label: "불만 접수" },
] as const;

type TabKey = typeof TABS[number]["key"];

interface MenuPanelProps {
  onClose: () => void;
  onStartTutorial?: () => void;
}

export default function MenuPanel({ onClose, onStartTutorial }: MenuPanelProps) {
  const [tab, setTab] = useState<TabKey>("guide");
  const [openGuide, setOpenGuide] = useState<number | null>(0);
  const [fbTitle, setFbTitle] = useState("");
  const [fbBody, setFbBody] = useState("");
  const [fbSent, setFbSent] = useState(false);

  const handleFeedbackSubmit = () => {
    if (!fbTitle.trim() || !fbBody.trim()) return;
    const subject = encodeURIComponent(`[MediQ 불만접수] ${fbTitle}`);
    const body = encodeURIComponent(`${fbBody}\n\n---\n앱 버전: ${APP_VERSION}\n접수일: ${new Date().toLocaleDateString("ko-KR")}`);
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    setFbSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white w-full max-w-xs lg:max-w-sm h-full flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3.5" style={{ backgroundColor: UBCARE_ORANGE }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <MediQIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">MediQ</p>
              <p className="text-white/70 text-[10px] leading-tight">Your Health Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white text-lg leading-none">×</button>
        </div>

        {/* 사용 가이드 체험 버튼 */}
        {onStartTutorial && (
          <button
            onClick={onStartTutorial}
            className="mx-4 my-3 flex items-center gap-3 px-4 py-3 rounded-xl border-2 w-[calc(100%-2rem)] transition-all hover:opacity-90 active:scale-95"
            style={{ borderColor: UBCARE_ORANGE, backgroundColor: "#fff7f0" }}
          >
            <span className="text-xl flex-shrink-0">🎓</span>
            <div className="text-left">
              <p className="text-sm font-bold" style={{ color: UBCARE_ORANGE }}>사용 가이드 체험</p>
              <p className="text-[11px] text-gray-500 mt-0.5">주요 기능을 단계별로 안내해드려요</p>
            </div>
            <span className="ml-auto text-gray-400 text-sm flex-shrink-0">→</span>
          </button>
        )}

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
              <p className="text-xs text-gray-500">MediQ의 기능 업데이트 내역입니다.</p>
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: UBCARE_ORANGE }}>
                    <MediQIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">MediQ</p>
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:border-transparent"
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
