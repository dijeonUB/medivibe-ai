"use client";

// ─── 병원 찾기 카드 ──────────────────────────────────────

import { SymptomData } from "@/types";
import { URGENCY_STYLE } from "@/constants";

interface HospitalCardProps {
  data: SymptomData;
}

export default function HospitalCard({ data }: HospitalCardProps) {
  const s = URGENCY_STYLE[data.urgency] ?? URGENCY_STYLE["일반"];
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden max-w-sm">
      <div className={`px-3 py-2 flex items-center gap-2 ${s.bg} border-b ${s.border}`}>
        <span className="text-sm">{s.icon}</span>
        <span className={`font-semibold text-sm ${s.text}`}>추천 진료과: {data.department}</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${s.bg} ${s.text} ${s.border}`}>{data.urgency}</span>
      </div>
      {data.urgencyReason && <p className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">{data.urgencyReason}</p>}
      <div className="p-2.5 grid grid-cols-2 gap-1.5">
        <a href={`https://map.kakao.com/?q=${encodeURIComponent(data.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-colors">
          🗺️ 카카오맵
        </a>
        <a href={`https://map.naver.com/v5/search/${encodeURIComponent(data.searchKeyword)}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors">
          🗺️ 네이버지도
        </a>
        <a href={`https://booking.naver.com/booking/13/bizes?serviceType=1&keywords=${encodeURIComponent(data.department)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold text-white transition-colors col-span-2"
          style={{ backgroundColor: "#03c75a" }}>
          📅 네이버 예약
        </a>
        {data.urgency === "응급" && (
          <a href="tel:119" className="flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors col-span-2">
            🚨 119 응급 신고
          </a>
        )}
      </div>
    </div>
  );
}
