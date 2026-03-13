"use client";

// ─── 건강기록 캘린더 ──────────────────────────────────────

import { useState } from "react";
import { HealthSession } from "@/types";
import { UBCARE_ORANGE } from "@/constants";
import { todayStr } from "@/utils/healthStorage";

interface CalendarProps {
  sessions: HealthSession[];
  selectedDate: string | null;
  onSelectDate: (d: string) => void;
  onViewMonthChange?: (year: number, month: number) => void;
}

export default function Calendar({ sessions, selectedDate, onSelectDate, onViewMonthChange }: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const toDateStr = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // 날짜별 세션 맵: { "2026-03-13": [session, ...] }
  const dateMap = sessions.reduce<Record<string, HealthSession[]>>((acc, s) => {
    acc[s.date] = [...(acc[s.date] ?? []), s];
    return acc;
  }, {});

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setViewDate(next);
    onViewMonthChange?.(next.getFullYear(), next.getMonth());
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button onClick={() => changeMonth(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg font-bold transition-colors">‹</button>
        <span className="font-bold text-gray-900">{year}년 {month + 1}월</span>
        <button onClick={() => changeMonth(1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg font-bold transition-colors">›</button>
      </div>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center py-2.5 border-b border-gray-100 bg-gray-50">
        {["일","월","화","수","목","금","토"].map((d, i) => (
          <span key={d} className={`text-xs font-bold ${i===0?"text-red-400":i===6?"text-blue-400":"text-gray-500"}`}>{d}</span>
        ))}
      </div>
      {/* 날짜 셀 */}
      <div className="grid grid-cols-7 p-2 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} className="h-16" />;
          const dateStr = toDateStr(day);
          const daySessions = dateMap[dateStr] ?? [];
          const count = daySessions.length;
          const hasRecord = count > 0;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr();
          // 가장 최근 세션의 진료과
          const dept = daySessions[0]?.symptomData?.department;
          const weekday = new Date(dateStr).getDay();
          return (
            <button key={dateStr}
              onClick={() => hasRecord && onSelectDate(dateStr)}
              className={`h-16 w-full flex flex-col items-center justify-start pt-1.5 rounded-xl transition-all overflow-hidden ${
                hasRecord ? "cursor-pointer hover:scale-105" : "cursor-default"
              }`}
              style={
                isSelected
                  ? { backgroundColor: UBCARE_ORANGE }
                  : isToday
                  ? { border: `2px solid ${UBCARE_ORANGE}` }
                  : hasRecord
                  ? { backgroundColor: "#fff7f0", border: `1px solid #fed7aa` }
                  : {}
              }>
              {/* 날짜 숫자 */}
              <span className={`text-sm leading-none font-bold ${
                isSelected ? "text-white" :
                isToday ? "" :
                weekday === 0 ? "text-red-500" :
                weekday === 6 ? "text-blue-500" :
                hasRecord ? "text-gray-900" : "text-gray-400"
              }`} style={isToday && !isSelected ? { color: UBCARE_ORANGE } : {}}>
                {day}
              </span>
              {/* 건수 뱃지 */}
              {hasRecord && (
                <span className={`mt-0.5 text-[10px] font-bold leading-none ${isSelected ? "text-orange-100" : ""}`}
                  style={!isSelected ? { color: UBCARE_ORANGE } : {}}>
                  {count}건
                </span>
              )}
              {/* 추천과 */}
              {dept && (
                <span className={`mt-0.5 px-1 text-[9px] font-semibold leading-tight text-center truncate w-full ${
                  isSelected ? "text-white/80" : "text-gray-500"
                }`}>
                  {dept.length > 4 ? dept.slice(0, 4) : dept}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* 범례 */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fff7f0", border: "1px solid #fed7aa" }} />
          <span className="text-[10px] text-gray-500">상담 기록 있음</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: UBCARE_ORANGE }} />
          <span className="text-[10px] text-gray-500">선택된 날짜</span>
        </div>
      </div>
    </div>
  );
}
