"use client";

// ─── 건강식품 추천 뷰 ────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";
import { SupplementsData } from "@/types";
import { UBCARE_ORANGE } from "@/constants";
import { PillIcon } from "@/components/icons";
import DataSplash from "@/components/DataSplash";

const SUPP_CATEGORIES = [
  { id: "면역력", emoji: "🛡️" }, { id: "피로회복", emoji: "⚡" },
  { id: "관절건강", emoji: "🦴" }, { id: "눈건강", emoji: "👁️" },
  { id: "소화건강", emoji: "🌿" }, { id: "수면개선", emoji: "😴" },
  { id: "피부건강", emoji: "✨" }, { id: "다이어트", emoji: "💪" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "인기순" },
  { value: "priceLow", label: "가격낮은순" },
  { value: "priceHigh", label: "가격높은순" },
];

const SUPP_ICON_MAP: Record<string, { emoji: string; bg: string; text: string }> = {
  "면역력":  { emoji: "🛡️", bg: "#fff7ed", text: "#c2410c" },
  "피로회복": { emoji: "⚡", bg: "#fefce8", text: "#a16207" },
  "관절건강": { emoji: "🦴", bg: "#f0fdf4", text: "#15803d" },
  "눈건강":  { emoji: "👁️", bg: "#eff6ff", text: "#1d4ed8" },
  "소화건강": { emoji: "🌿", bg: "#f0fdf4", text: "#166534" },
  "수면개선": { emoji: "🌙", bg: "#f5f3ff", text: "#6d28d9" },
  "피부건강": { emoji: "✨", bg: "#fdf4ff", text: "#9333ea" },
  "다이어트": { emoji: "🏃", bg: "#fff1f2", text: "#e11d48" },
};

const RANK_COLORS = [
  { bg: "#fef9c3", text: "#854d0e", border: "#fde047" },  // 금 1위
  { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },  // 은 2위
  { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },  // 동 3위
];

export default function SupplementsView() {
  const [category, setCategory] = useState("면역력");
  const [sortBy, setSortBy] = useState("popular");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SupplementsData | null>(null);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 클라이언트 캐시 (컴포넌트 생존 동안 유지)
  const cache = useRef<Record<string, SupplementsData>>({});

  const fetchSupplements = useCallback(async (cat: string, sort: string) => {
    const key = `${cat}_${sort}`;
    // 캐시 히트 시 즉시 반환
    if (cache.current[key]) {
      setData(cache.current[key]);
      setShowAll(false);
      setExpandedId(null);
      return;
    }
    setLoading(true); setError(""); setExpandedId(null); setShowAll(false);
    try {
      const res = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, sortBy: sort }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      cache.current[key] = json;
      setData(json);
    } catch {
      setError("추천 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSupplements(category, sortBy); }, [category, sortBy, fetchSupplements]);

  const iconInfo = SUPP_ICON_MAP[category] ?? { emoji: "💊", bg: "#fff7ed", text: "#c2410c" };
  const visibleProducts = data?.products ? (showAll ? data.products : data.products.slice(0, 5)) : [];
  const hasMore = (data?.products?.length ?? 0) > 5 && !showAll;

  // 스플래시 표시 시 전체 화면
  if (loading) return <DataSplash type="supplements" />;

  return (
    <div className="h-full overflow-y-auto px-4 lg:px-6 py-5">
      <div className="max-w-none">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <PillIcon className="w-5 h-5" style={{ color: UBCARE_ORANGE }} />
            건강식품 추천
          </h2>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 rounded-full text-xs font-semibold" style={{ color: UBCARE_ORANGE }}>
            🤖 AI 큐레이션
          </span>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {SUPP_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category === cat.id ? "text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
              }`}
              style={category === cat.id ? { backgroundColor: UBCARE_ORANGE } : {}}>
              <span>{cat.emoji}</span>{cat.id}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-2 mb-3">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === opt.value ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* 면책 고지 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4 flex items-start gap-2">
          <span className="text-blue-400 text-xs mt-0.5">ℹ️</span>
          <p className="text-xs text-blue-600">AI가 제공하는 참고용 정보입니다. 실제 가격·순위는 각 쇼핑몰에서 확인하세요.</p>
        </div>

        {/* 오류 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button onClick={() => fetchSupplements(category, sortBy)} className="text-xs text-red-500 underline">다시 시도</button>
          </div>
        )}

        {/* 카테고리 설명 */}
        {data?.categoryInfo && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">{data.categoryInfo}</p>
        )}

        {/* 제품 그리드 */}
        {visibleProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {visibleProducts.map((product, idx) => {
                const rc = RANK_COLORS[idx] ?? { bg: "#f8fafc", text: "#94a3b8", border: "#e2e8f0" };
                return (
                  <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 flex-1">
                      <div className="flex items-start gap-3">
                        {/* 제품 아이콘 이미지 */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: iconInfo.bg }}>
                            {iconInfo.emoji}
                          </div>
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border"
                            style={{ backgroundColor: rc.bg, color: rc.text, borderColor: rc.border }}>
                            {product.rank ?? idx + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-bold text-gray-900 leading-tight">{product.name}</p>
                            <p className="text-xs font-bold flex-shrink-0 ml-1" style={{ color: UBCARE_ORANGE }}>{product.priceRange}</p>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{product.brand} · {product.unit}</p>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{product.mainBenefit}</p>
                          {product.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.tags.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-medium rounded-md">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                        className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                        {expandedId === idx ? "▲ 닫기" : "▼ 상세 효능 보기"}
                      </button>

                      {expandedId === idx && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">주요 효능</p>
                          <ul className="space-y-1">
                            {product.benefits?.map((b, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="mt-0.5 flex-shrink-0" style={{ color: UBCARE_ORANGE }}>•</span>{b}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 grid grid-cols-2 mt-auto">
                      <a href={`https://www.coupang.com/np/search?q=${encodeURIComponent(product.searchKeyword)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-gray-700 hover:bg-orange-50 border-r border-gray-100 transition-colors">
                        🛒 쿠팡
                      </a>
                      <a href={`https://search.shopping.naver.com/search/all?query=${encodeURIComponent(product.searchKeyword)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 py-2.5 text-xs font-semibold text-gray-700 hover:bg-green-50 transition-colors">
                        🔍 네이버
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 더보기 버튼 */}
            {hasMore && (
              <button onClick={() => setShowAll(true)}
                className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-orange-300 hover:text-orange-500 transition-all flex items-center justify-center gap-2">
                <span>⬇</span> 더보기 — 추가 {(data?.products?.length ?? 0) - 5}개 제품 보기
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
