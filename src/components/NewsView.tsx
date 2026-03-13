"use client";

// ─── 건강뉴스 뷰 ─────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { NewsData } from "@/types";
import { UBCARE_ORANGE } from "@/constants";
import { NewsIcon } from "@/components/icons";
import DataSplash from "@/components/DataSplash";

const SEASON_CONFIG: Record<string, { bg: string; emoji: string; textColor: string }> = {
  "봄":  { bg: "bg-green-50",  emoji: "🌸", textColor: "text-green-700" },
  "여름": { bg: "bg-sky-50",    emoji: "☀️", textColor: "text-sky-700" },
  "가을": { bg: "bg-amber-50",  emoji: "🍂", textColor: "text-amber-700" },
  "겨울": { bg: "bg-blue-50",   emoji: "❄️", textColor: "text-blue-700" },
};

export default function NewsView() {
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
