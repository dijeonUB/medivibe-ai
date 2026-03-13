// ─── 채팅 커스텀 훅 ──────────────────────────────────────

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Message, HealthSession } from "@/types";
import { todayStr, generateId, parseSymptomData, generateSessionTitle } from "@/utils/healthStorage";
import { useHealthStore } from "@/store/healthStore";

// 타입화된 API 에러
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function useChat() {
  const upsertSession = useHealthStore((s) => s.upsertSession);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(generateId);

  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const persistSession = useCallback(
    (msgs: Message[]) => {
      if (!msgs.some((m) => m.role === "user")) return;
      const lastSymptom = [...msgs].reverse().find((m) => m.symptomData)?.symptomData;
      upsertSession({
        id: currentSessionId,
        date: todayStr(),
        createdAt: new Date().toISOString(),
        title: generateSessionTitle(msgs, lastSymptom),
        messages: msgs,
        symptomData: lastSymptom,
      });
    },
    [currentSessionId, upsertSession]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // 이전 요청 취소 후 새 AbortController 생성
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const userMsg: Message = { role: "user", content: text };
      const nextMessages = [...messages, userMsg];
      setMessages([...nextMessages, { role: "assistant", content: "" }]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({ role, content })),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) throw new ApiError(res.status, `HTTP 오류: ${res.status}`);

        const reader = res.body?.getReader();
        if (!reader) throw new ApiError(0, "스트림을 읽을 수 없습니다.");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value);
          // 스트리밍 중 SYMPTOM_DATA 태그 임시 제거하여 표시
          const display = fullText
            .replace(/\[SYMPTOM_DATA\][\s\S]*?(\[\/SYMPTOM_DATA\]|$)/g, "")
            .trim();
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: display };
            return updated;
          });
        }

        const { clean, symptomData } = parseSymptomData(fullText);
        const finalMessages: Message[] = [
          ...nextMessages,
          { role: "assistant", content: clean, symptomData },
        ];
        setMessages(finalMessages);
        persistSession(finalMessages);
      } catch (err) {
        // 사용자가 취소한 요청은 무시
        if (err instanceof Error && err.name === "AbortError") return;
        const msg =
          err instanceof ApiError
            ? `서버 오류가 발생했습니다. (${err.status})`
            : "오류가 발생했습니다. 다시 시도해주세요.";
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: msg };
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, persistSession]
  );

  // 새 대화 시작
  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setCurrentSessionId(generateId());
    setInput("");
  }, []);

  // 기존 세션 이어서 상담 (새 세션 ID로 분기 저장)
  const loadSession = useCallback((session: HealthSession) => {
    abortRef.current?.abort();
    setMessages(session.messages);
    setCurrentSessionId(generateId());
    setInput("");
  }, []);

  return {
    messages,
    input,
    isLoading,
    setInput,
    sendMessage,
    startNewChat,
    loadSession,
    messagesEndRef,
  };
}
