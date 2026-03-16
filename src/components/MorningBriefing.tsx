"use client";

// ─── 아침 건강 브리핑 카드 ────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { MorningBriefingData, SessionSummary } from "@/types";
import { BRIEFING_CACHE_PREFIX } from "@/constants";
import { useHealthStore } from "@/store/healthStore";

function getTodayKey() {
  return BRIEFING_CACHE_PREFIX + new Date().toISOString().slice(0, 10);
}

function getRecentSessionSummaries(): SessionSummary[] {
  // 최근 3일 기준 날짜 계산
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const sessions = useHealthStore.getState().sessions;
  return sessions
    .filter((s) => s.date >= cutoffStr)
    .slice(0, 5)
    .map((s) => ({
      date: s.date,
      title: s.title,
      department: s.symptomData?.department,
      urgency: s.symptomData?.urgency,
      urgencyReason: s.symptomData?.urgencyReason,
      messageCount: s.messages.length,
    }));
}

export default function MorningBriefing() {
  const [data, setData] = useState<MorningBriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBriefing = useCallback(async (skipCache = false) => {
    setLoading(true);
    const cacheKey = getTodayKey();

    // 캐시 확인
    if (!skipCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        }
      } catch { /* 캐시 오류 무시 */ }
    }

    try {
      const recentSessions = getRecentSessionSummaries();
      const month = new Date().getMonth() + 1;
      const res = await fetch("/api/morning-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recentSessions, month }),
      });
      const json: MorningBriefingData & { error?: string } = await res.json();
      if (json.error) throw new Error(json.error);

      // 캐시 저장
      try { localStorage.setItem(cacheKey, JSON.stringify(json)); } catch { /* 무시 */ }
      setData(json);
    } catch {
      // 조용히 실패 — 브리핑 카드 숨김
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  // 로딩 중: 작은 스켈레톤
  if (loading) {
    return (
      <div className="w-full max-w-lg bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 mb-2 animate-pulse">
        <div className="h-4 bg-orange-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-orange-100 rounded w-2/3 mb-2" />
        <div className="h-3 bg-orange-100 rounded w-1/2" />
      </div>
    );
  }

  // 데이터 없으면 숨김
  if (!data) return null;

  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  return (
    <div className="w-full max-w-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 mb-2 text-left shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-base">☀️</span>
          <span className="text-xs font-bold text-orange-700">오늘의 건강 브리핑</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-orange-400">{today}</span>
          <button
            onClick={() => fetchBriefing(true)}
            className="text-[10px] text-orange-400 hover:text-orange-600 transition-colors"
            title="브리핑 새로고침">
            ↺
          </button>
        </div>
      </div>

      {/* 인사 */}
      <p className="text-sm font-semibold text-gray-800 mb-2 leading-snug">{data.greeting}</p>

      {/* 최근 상담 요약 태그 */}
      {data.recentSummary && (
        <div className="bg-orange-100 text-orange-700 text-xs rounded-lg px-3 py-1.5 mb-2 leading-snug">
          📋 {data.recentSummary}
        </div>
      )}

      {/* 계절 팁 + 오늘 조언 */}
      <div className="space-y-1 mb-3">
        <p className="text-xs text-gray-600 leading-snug">🌿 {data.seasonalTip}</p>
        <p className="text-xs text-gray-700 font-medium leading-snug">💡 {data.todayAdvice}</p>
      </div>

      {/* 오늘의 체크 항목 */}
      {data.quickCheckItems.length > 0 && (
        <div className="border-t border-orange-100 pt-2.5">
          <p className="text-[10px] font-bold text-orange-600 mb-1.5">오늘의 건강 체크</p>
          <ul className="space-y-1">
            {data.quickCheckItems.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
