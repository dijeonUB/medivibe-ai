// ─── 건강기록 Zustand 스토어 ─────────────────────────────

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { HealthSession } from "@/types";
import { STORAGE_KEY } from "@/constants";

interface HealthStoreState {
  sessions: HealthSession[];
  upsertSession: (session: HealthSession) => void;
  removeById: (id: string) => void;
  removeByMonth: (year: number, month: number) => void;
  clearAll: () => void;
}

// 기존 plain-array 포맷과 호환되는 localStorage 어댑터
const compatStorage = createJSONStorage<HealthStoreState>(() => ({
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // 구 포맷 (배열) → Zustand 포맷으로 마이그레이션
        return JSON.stringify({ state: { sessions: parsed }, version: 0 });
      }
      return raw;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      const { state } = JSON.parse(value) as { state: Pick<HealthStoreState, "sessions"> };
      // sessions 배열만 저장 → healthStorage.ts 유틸과 동일 포맷 유지
      localStorage.setItem(key, JSON.stringify(state.sessions));
    } catch {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== "undefined") localStorage.removeItem(key);
  },
}));

export const useHealthStore = create<HealthStoreState>()(
  persist(
    (set) => ({
      sessions: [],

      // 세션 추가 또는 덮어쓰기 (id 기준)
      upsertSession: (session) =>
        set((state) => {
          const idx = state.sessions.findIndex((s) => s.id === session.id);
          const next = [...state.sessions];
          if (idx >= 0) next[idx] = session;
          else next.unshift(session);
          return { sessions: next };
        }),

      removeById: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      removeByMonth: (year, month) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => {
            const d = new Date(s.date);
            return !(d.getFullYear() === year && d.getMonth() === month);
          }),
        })),

      clearAll: () => set({ sessions: [] }),
    }),
    {
      name: STORAGE_KEY,
      storage: compatStorage,
    }
  )
);
