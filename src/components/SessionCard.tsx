"use client";

// ─── 건강기록 세션 카드 ───────────────────────────────────

import { HealthSession } from "@/types";
import { URGENCY_STYLE, UBCARE_ORANGE } from "@/constants";
import { TrashIcon, ReplyIcon } from "@/components/icons";

interface SessionCardProps {
  s: HealthSession;
  selectedSession: HealthSession | null;
  setSelectedSession: (s: HealthSession | null) => void;
  onDelete: (id: string) => void;
  onContinue: (s: HealthSession) => void;
}

export default function SessionCard({ s, selectedSession, setSelectedSession, onDelete, onContinue }: SessionCardProps) {
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
