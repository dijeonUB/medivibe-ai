"use client";

// ─── 건강 이력 분석 뷰 ───────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { HealthInsightData, SessionSummary } from "@/types";
import { UBCARE_ORANGE, INSIGHT_CACHE_PREFIX, URGENCY_STYLE } from "@/constants";
import { InsightIcon } from "@/components/icons";
import DataSplash from "@/components/DataSplash";
import { useHealthStore } from "@/store/healthStore";

// 이번 월 캐시 키 — 한 달 단위로 갱신
function getMonthlyKey(): string {
  return INSIGHT_CACHE_PREFIX + new Date().toISOString().slice(0, 7);
}

// 2개월 이상 된 캐시 정리
function cleanOldCache() {
  try {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 2);
    const cutoffStr = INSIGHT_CACHE_PREFIX + cutoff.toISOString().slice(0, 7);
    Object.keys(localStorage)
      .filter((k) => k.startsWith(INSIGHT_CACHE_PREFIX) && k < cutoffStr)
      .forEach((k) => localStorage.removeItem(k));
    // 구 weekly_ 캐시도 정리
    Object.keys(localStorage)
      .filter((k) => k.startsWith("medivibe_weekly_"))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* 무시 */ }
}

// 전체 세션 → SessionSummary 배열 (최대 3년치)
function getAllSessionSummaries(): SessionSummary[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 3);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return useHealthStore.getState().sessions
    .filter((s) => s.date >= cutoffStr)
    .map((s) => ({
      date: s.date,
      title: s.title,
      department: s.symptomData?.department,
      urgency: s.symptomData?.urgency,
      urgencyReason: s.symptomData?.urgencyReason,
      messageCount: s.messages.length,
    }));
}

const BAR_COLORS = ["#ec6120", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5", "#fff7ed", "#fffbf5", "#fef3c7", "#fde68a"];

export default function InsightView() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HealthInsightData | null>(null);
  const [error, setError] = useState("");
  const fetched = useRef(false);

  useEffect(() => {
    cleanOldCache();
    if (fetched.current) return;
    fetched.current = true;

    const cacheKey = getMonthlyKey();
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch { /* 무시 */ }

    const summaries = getAllSessionSummaries();

    fetch("/api/weekly-insight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions: summaries }),
    })
      .then((r) => r.json())
      .then((json: HealthInsightData & { error?: string }) => {
        if (json.error) throw new Error(json.error);
        try { localStorage.setItem(cacheKey, JSON.stringify(json)); } catch { /* 무시 */ }
        setData(json);
      })
      .catch(() => setError("이력 분석을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DataSplash type="insight" />;

  const maxKeywordCount = data?.topKeywords?.[0]?.count ?? 1;

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-6 py-5">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <InsightIcon className="w-5 h-5" style={{ color: UBCARE_ORANGE }} />
            건강 이력 분석
          </h2>
          {data?.period && (
            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
              {data.period}
            </span>
          )}
        </div>

        {/* 오류 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 세션 0건 빈 상태 */}
        {data && data.totalSessions === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <InsightIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500 mb-1">아직 분석할 상담 기록이 없습니다</p>
            <p className="text-xs text-gray-400">AI 상담을 시작하면 건강 이력 분석이 생성됩니다</p>
          </div>
        )}

        {data && data.totalSessions > 0 && (
          <div className="space-y-4">
            {/* 1. 종합 평가 배너 */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-orange-600 mb-1.5">✦ 종합 평가</p>
              <p className="text-sm text-gray-800 leading-relaxed">{data.overallAssessment}</p>
              {/* 요약 통계 */}
              <div className="flex gap-4 mt-3 pt-3 border-t border-orange-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">{data.totalSessions}</p>
                  <p className="text-[10px] text-gray-400">전체 상담</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-orange-600">{data.averagePerMonth}</p>
                  <p className="text-[10px] text-gray-400">월평균</p>
                </div>
                {data.departmentStats.length > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">{data.departmentStats[0].department}</p>
                    <p className="text-[10px] text-gray-400">최다 진료과</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. 건강 키워드 */}
            {data.topKeywords.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-700 mb-3">🔍 반복 건강 키워드</p>
                <div className="space-y-2">
                  {data.topKeywords.map((kw, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0 truncate">{kw.keyword}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.round((kw.count / maxKeywordCount) * 100)}%`,
                            backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-6 text-right flex-shrink-0">{kw.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. 진료과 분포 */}
            {data.departmentStats.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-700 mb-3">🏥 진료과 분포</p>
                <div className="flex flex-wrap gap-2">
                  {data.departmentStats.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: BAR_COLORS[i % 3] }}>
                      {d.department}
                      <span className="bg-white/30 rounded-full px-1.5 py-0.5 text-[10px]">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 긴급도 분포 */}
            {data.urgencyBreakdown.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-700 mb-3">⚡ 긴급도 분포</p>
                <div className="flex gap-3 flex-wrap">
                  {data.urgencyBreakdown.map((u, i) => {
                    const style = URGENCY_STYLE[u.level as keyof typeof URGENCY_STYLE];
                    if (!style) return null;
                    return (
                      <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${style.bg} ${style.border}`}>
                        <span>{style.icon}</span>
                        <span className={`text-xs font-semibold ${style.text}`}>{u.level}</span>
                        <span className={`text-xs ${style.text} opacity-70`}>{u.count}건</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. 월별 증상 타임라인 */}
            {data.symptomTimeline.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-700 mb-3">📅 월별 증상 타임라인</p>
                <div className="space-y-2">
                  {data.symptomTimeline.map((tl, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[10px] text-gray-400 flex-shrink-0 w-14 pt-0.5 font-medium">
                        {tl.date}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tl.symptoms.map((sym, j) => (
                          <span key={j} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-md">{sym}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. 추천사항 */}
            {data.recommendations.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs font-bold text-gray-700 mb-3">💚 이력 기반 건강 추천</p>
                <ul className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
