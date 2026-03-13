// ─── 건강기록 localStorage 유틸 ─────────────────────────

import { HealthSession, Message, SymptomData } from "@/types";
import { STORAGE_KEY } from "@/constants";

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function parseSymptomData(text: string): { clean: string; symptomData?: SymptomData } {
  const match = text.match(/\[SYMPTOM_DATA\]([\s\S]*?)\[\/SYMPTOM_DATA\]/);
  if (!match) return { clean: text.trim() };
  try {
    const symptomData: SymptomData = JSON.parse(match[1].trim());
    const clean = text.replace(/\[SYMPTOM_DATA\][\s\S]*?\[\/SYMPTOM_DATA\]/g, "").trim();
    return { clean, symptomData };
  } catch {
    return { clean: text.replace(/\[SYMPTOM_DATA\][\s\S]*?\[\/SYMPTOM_DATA\]/g, "").trim() };
  }
}

export function generateSessionTitle(msgs: Message[], symptomData?: SymptomData): string {
  if (symptomData) {
    const dept = symptomData.department;
    const reason = symptomData.urgencyReason || "";
    const shortReason = reason.length > 22 ? reason.slice(0, 22) + "…" : reason;
    return shortReason ? `${dept} — ${shortReason}` : `${dept} 진료 상담`;
  }
  const firstUser = msgs.find((m) => m.role === "user")?.content ?? "";
  const firstLine = firstUser.split("\n")[0].trim();
  return firstLine.length > 28 ? firstLine.slice(0, 28) + "…" : firstLine || "건강 상담";
}

export function loadSessions(): HealthSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSession(session: HealthSession): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSessionById(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSessionsByMonth(year: number, month: number): void {
  const sessions = loadSessions().filter((s) => {
    const d = new Date(s.date);
    return !(d.getFullYear() === year && d.getMonth() === month);
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteAllSessions(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}
