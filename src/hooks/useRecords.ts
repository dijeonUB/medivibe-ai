// ─── 건강기록 커스텀 훅 ──────────────────────────────────

"use client";

import { useState, useMemo, useCallback } from "react";
import type { HealthSession } from "@/types";
import { todayStr } from "@/utils/healthStorage";
import { useHealthStore } from "@/store/healthStore";

export function useRecords() {
  const sessions = useHealthStore((s) => s.sessions);
  const removeById = useHealthStore((s) => s.removeById);
  const removeByMonth = useHealthStore((s) => s.removeByMonth);
  const clearAll = useHealthStore((s) => s.clearAll);

  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);
  const [selectedSession, setSelectedSession] = useState<HealthSession | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  }));
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // 검색어 or 날짜 필터링된 세션 목록 (메모이제이션)
  const displaySessions = useMemo<HealthSession[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.messages.some((m) => m.content.toLowerCase().includes(q)) ||
          (s.symptomData?.department.toLowerCase().includes(q) ?? false)
      );
    }
    return sessions.filter((s) => s.date === selectedDate);
  }, [sessions, searchQuery, selectedDate]);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setConfirmDialog({
        message: "이 상담 기록을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.",
        onConfirm: () => {
          removeById(id);
          if (selectedSession?.id === id) setSelectedSession(null);
          setConfirmDialog(null);
        },
      });
    },
    [removeById, selectedSession]
  );

  const handleDeleteMonth = useCallback(() => {
    const { year, month } = calendarMonth;
    const count = sessions.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
    if (count === 0) return;
    setConfirmDialog({
      message: `${year}년 ${month + 1}월 상담 기록 ${count}건을 모두 삭제하시겠습니까?`,
      onConfirm: () => {
        removeByMonth(year, month);
        setSelectedSession(null);
        setConfirmDialog(null);
      },
    });
  }, [calendarMonth, sessions, removeByMonth]);

  const handleDeleteAll = useCallback(() => {
    if (sessions.length === 0) return;
    setConfirmDialog({
      message: `전체 상담 기록 ${sessions.length}건을 모두 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`,
      onConfirm: () => {
        clearAll();
        setSelectedSession(null);
        setSelectedDate(todayStr());
        setConfirmDialog(null);
      },
    });
  }, [sessions.length, clearAll]);

  return {
    sessions,
    selectedDate,
    setSelectedDate,
    selectedSession,
    setSelectedSession,
    calendarMonth,
    setCalendarMonth,
    searchQuery,
    setSearchQuery,
    displaySessions,
    confirmDialog,
    setConfirmDialog,
    handleDeleteSession,
    handleDeleteMonth,
    handleDeleteAll,
  };
}
