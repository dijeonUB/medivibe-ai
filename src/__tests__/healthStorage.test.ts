// ─── healthStorage 유틸 테스트 ───────────────────────────────
import { describe, it, expect, beforeEach } from "vitest";
import {
  todayStr,
  generateId,
  parseSymptomData,
  generateSessionTitle,
  loadSessions,
  saveSession,
  deleteSessionById,
  deleteSessionsByMonth,
  deleteAllSessions,
} from "@/utils/healthStorage";
import type { HealthSession, Message } from "@/types";

// ── todayStr ─────────────────────────────────────────────────
describe("todayStr()", () => {
  it("YYYY-MM-DD 형식을 반환한다", () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("오늘 날짜를 반환한다", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(todayStr()).toBe(today);
  });
});

// ── generateId ────────────────────────────────────────────────
describe("generateId()", () => {
  it("연속 호출 시 고유한 ID를 생성한다", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("timestamp-random 형식(숫자-영소문자)이다", () => {
    expect(generateId()).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

// ── parseSymptomData ─────────────────────────────────────────
describe("parseSymptomData()", () => {
  it("태그가 없으면 원문 그대로 반환한다", () => {
    const result = parseSymptomData("일반 텍스트입니다.");
    expect(result.clean).toBe("일반 텍스트입니다.");
    expect(result.symptomData).toBeUndefined();
  });

  it("[SYMPTOM_DATA] 태그를 파싱하고 텍스트에서 제거한다", () => {
    const payload = JSON.stringify({
      department: "내과",
      urgency: "일반",
      searchKeyword: "감기 내과",
      urgencyReason: "가벼운 발열 증상",
    });
    const text = `증상 안내 메시지입니다.\n[SYMPTOM_DATA]${payload}[/SYMPTOM_DATA]`;
    const result = parseSymptomData(text);
    expect(result.clean).toBe("증상 안내 메시지입니다.");
    expect(result.symptomData?.department).toBe("내과");
    expect(result.symptomData?.urgency).toBe("일반");
    expect(result.symptomData?.searchKeyword).toBe("감기 내과");
  });

  it("응급 urgency를 올바르게 파싱한다", () => {
    const payload = JSON.stringify({
      department: "응급실",
      urgency: "응급",
      searchKeyword: "응급실",
      urgencyReason: "심한 흉통",
    });
    const result = parseSymptomData(`[SYMPTOM_DATA]${payload}[/SYMPTOM_DATA]`);
    expect(result.symptomData?.urgency).toBe("응급");
    expect(result.clean).toBe("");
  });

  it("JSON 파싱 실패 시 clean 텍스트만 반환하고 symptomData는 undefined", () => {
    const text = "안내문구[SYMPTOM_DATA]invalid{{json[/SYMPTOM_DATA]";
    const result = parseSymptomData(text);
    expect(result.clean).toBe("안내문구");
    expect(result.symptomData).toBeUndefined();
  });

  it("태그가 여러 개여도 모두 제거한다", () => {
    const payload = JSON.stringify({ department: "내과", urgency: "일반", searchKeyword: "감기", urgencyReason: "" });
    const text = `앞[SYMPTOM_DATA]${payload}[/SYMPTOM_DATA]뒤[SYMPTOM_DATA]${payload}[/SYMPTOM_DATA]`;
    const result = parseSymptomData(text);
    expect(result.clean).toBe("앞뒤");
  });
});

// ── generateSessionTitle ─────────────────────────────────────
describe("generateSessionTitle()", () => {
  const msgs: Message[] = [{ role: "user", content: "두통이 심해요" }];

  it("symptomData가 있으면 진료과 + 사유 기반 제목을 생성한다", () => {
    const title = generateSessionTitle(msgs, {
      department: "신경과",
      urgency: "주의",
      searchKeyword: "두통 신경과",
      urgencyReason: "지속적인 두통과 어지러움",
    });
    expect(title).toContain("신경과");
    expect(title).toContain("지속적인 두통과 어지러움");
  });

  it("urgencyReason이 없으면 '진료 상담' 기본 형식을 반환한다", () => {
    const title = generateSessionTitle(msgs, {
      department: "피부과",
      urgency: "일반",
      searchKeyword: "피부과",
      urgencyReason: "",
    });
    expect(title).toBe("피부과 진료 상담");
  });

  it("symptomData가 없으면 첫 번째 user 메시지를 제목으로 사용한다", () => {
    expect(generateSessionTitle(msgs)).toBe("두통이 심해요");
  });

  it("28자 초과 메시지는 잘리고 … 이 붙는다", () => {
    const longMsgs: Message[] = [{ role: "user", content: "가".repeat(50) }];
    const title = generateSessionTitle(longMsgs);
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(29); // 28자 + "…"
  });

  it("urgencyReason이 22자 초과면 잘리고 … 이 붙는다", () => {
    const title = generateSessionTitle(msgs, {
      department: "내과",
      urgency: "주의",
      searchKeyword: "내과",
      urgencyReason: "나".repeat(30),
    });
    expect(title).toContain("…");
  });

  it("메시지가 비어 있으면 기본값 '건강 상담'을 반환한다", () => {
    expect(generateSessionTitle([])).toBe("건강 상담");
  });

  it("첫 메시지가 assistant이면 user 메시지를 찾아 제목으로 사용한다", () => {
    const mixedMsgs: Message[] = [
      { role: "assistant", content: "무엇을 도와드릴까요?" },
      { role: "user", content: "머리가 아파요" },
    ];
    expect(generateSessionTitle(mixedMsgs)).toBe("머리가 아파요");
  });
});

// ── localStorage 유틸 (jsdom 환경) ───────────────────────────
describe("localStorage 유틸", () => {
  const baseSession: HealthSession = {
    id: "session-001",
    date: "2026-03-13",
    createdAt: "2026-03-13T10:00:00.000Z",
    title: "테스트 세션",
    messages: [{ role: "user", content: "안녕하세요" }],
  };

  beforeEach(() => {
    localStorage.clear();
  });

  // loadSessions
  it("loadSessions() — 빈 스토리지에서 빈 배열을 반환한다", () => {
    expect(loadSessions()).toEqual([]);
  });

  it("loadSessions() — 잘못된 JSON이 있어도 빈 배열로 복구한다", () => {
    localStorage.setItem("healthvibe_sessions", "not-json");
    expect(loadSessions()).toEqual([]);
  });

  // saveSession
  it("saveSession() — 새 세션을 저장하고 다시 불러올 수 있다", () => {
    saveSession(baseSession);
    const sessions = loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe("session-001");
    expect(sessions[0].title).toBe("테스트 세션");
  });

  it("saveSession() — 새 세션은 배열 앞에 추가된다 (최신 우선)", () => {
    saveSession(baseSession);
    saveSession({ ...baseSession, id: "session-002", title: "두 번째 세션" });
    const sessions = loadSessions();
    expect(sessions[0].id).toBe("session-002");
  });

  it("saveSession() — 동일 id 세션은 업데이트한다", () => {
    saveSession(baseSession);
    saveSession({ ...baseSession, title: "업데이트된 제목" });
    const sessions = loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].title).toBe("업데이트된 제목");
  });

  // deleteSessionById
  it("deleteSessionById() — 지정 id 세션만 삭제한다", () => {
    saveSession(baseSession);
    saveSession({ ...baseSession, id: "session-002", title: "다른 세션" });
    deleteSessionById("session-001");
    const sessions = loadSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe("session-002");
  });

  it("deleteSessionById() — 없는 id 삭제 시 오류 없이 동작한다", () => {
    saveSession(baseSession);
    expect(() => deleteSessionById("nonexistent")).not.toThrow();
    expect(loadSessions()).toHaveLength(1);
  });

  // deleteSessionsByMonth
  it("deleteSessionsByMonth() — 해당 연/월 세션을 삭제한다", () => {
    saveSession(baseSession); // 2026-03 (getMonth() === 2)
    saveSession({ ...baseSession, id: "session-feb", date: "2026-02-15", title: "2월 세션" });
    deleteSessionsByMonth(2026, 2); // 0-based: 2 = 3월
    const sessions = loadSessions();
    expect(sessions.some((s) => s.id === "session-001")).toBe(false);
    expect(sessions.some((s) => s.id === "session-feb")).toBe(true);
  });

  it("deleteSessionsByMonth() — 다른 연도는 삭제하지 않는다", () => {
    saveSession(baseSession); // 2026-03
    saveSession({ ...baseSession, id: "session-2025", date: "2025-03-10", title: "2025년 3월" });
    deleteSessionsByMonth(2026, 2); // 2026년 3월만
    expect(loadSessions().some((s) => s.id === "session-2025")).toBe(true);
  });

  // deleteAllSessions
  it("deleteAllSessions() — 모든 세션을 삭제한다", () => {
    saveSession(baseSession);
    saveSession({ ...baseSession, id: "session-002" });
    deleteAllSessions();
    expect(loadSessions()).toEqual([]);
  });
});
