"use client";

// ─── 사이트 튜토리얼 오버레이 ────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { UBCARE_ORANGE } from "@/constants";

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialStep {
  targetAttr: string | null; // null → 화면 중앙 모달
  emoji: string;
  title: string;
  description: string;
}

const STEPS: TutorialStep[] = [
  {
    targetAttr: null,
    emoji: "👋",
    title: "MediVibe AI에 오신 것을 환영합니다!",
    description: "AI 기반 의료 정보 도우미 서비스입니다.\n약 30초 가이드로 주요 기능을 살펴볼게요.",
  },
  {
    targetAttr: "nav-chat",
    emoji: "💬",
    title: "AI 건강 상담",
    description: "증상을 자유롭게 입력하면\nAI가 진료과를 추천하고\n근처 병원까지 바로 연결해드려요.",
  },
  {
    targetAttr: "nav-records",
    emoji: "📅",
    title: "건강기록",
    description: "상담 내역이 자동으로 저장돼요.\n캘린더로 날짜별 조회하거나\n키워드로 검색할 수 있어요.",
  },
  {
    targetAttr: "nav-supplements",
    emoji: "💊",
    title: "건강식품 추천",
    description: "면역력·피로회복 등 카테고리별\nAI 큐레이션 건강식품을 추천해요.\n쿠팡·네이버 쇼핑 바로 연결됩니다.",
  },
  {
    targetAttr: "nav-news",
    emoji: "📰",
    title: "건강뉴스",
    description: "현재 계절에 맞는 건강 정보를\n자동으로 제공해요.\n예방법·추천 음식까지 확인해보세요.",
  },
  {
    targetAttr: "menu-btn",
    emoji: "☰",
    title: "메뉴",
    description: "기능 안내·업데이트 내역·앱 정보·\n불만 접수를 확인할 수 있어요.\n이 메뉴에서 가이드를 다시 볼 수 있어요!",
  },
  {
    targetAttr: null,
    emoji: "🚀",
    title: "준비 완료!",
    description: "이제 MediVibe AI를 자유롭게\n사용할 수 있어요.\n궁금한 증상을 바로 물어보세요!",
  },
];

const PADDING = 10; // spotlight 여백(px)

// data-tutorial 속성이 일치하는 첫 번째 visible 요소의 위치를 반환
function getTargetRect(attr: string): SpotlightRect | null {
  const els = document.querySelectorAll(`[data-tutorial="${attr}"]`);
  for (const el of els) {
    const r = (el as HTMLElement).getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    }
  }
  return null;
}

interface TutorialOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function TutorialOverlay({ isVisible, onClose }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [visible, setVisible] = useState(false); // fade-in 제어
  const rafRef = useRef<number | null>(null);

  // step 변경 시 spotlight 위치 업데이트
  const updateSpotlight = useCallback(() => {
    const cur = STEPS[step];
    if (!cur?.targetAttr) { setSpotlight(null); return; }
    const rect = getTargetRect(cur.targetAttr);
    setSpotlight(rect);
  }, [step]);

  // isVisible 변경 처리
  useEffect(() => {
    if (isVisible) {
      setStep(0);
      setVisible(false);
      setTimeout(() => setVisible(true), 30);
    } else {
      setVisible(false);
    }
  }, [isVisible]);

  // step 변경 시 spotlight 갱신
  useEffect(() => {
    if (!isVisible) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(updateSpotlight); // 2 frames — 레이아웃 안정화
    });
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isVisible, step, updateSpotlight]);

  // 리사이즈 시 spotlight 갱신
  useEffect(() => {
    if (!isVisible) return;
    const onResize = () => updateSpotlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isVisible, updateSpotlight]);

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) onClose();
    else setStep((s) => s + 1);
  }, [step, onClose]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (!isVisible) return null;

  const cur = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  // ── spotlight 스타일 ─────────────────────────────────────
  const spotStyle: React.CSSProperties | null = spotlight
    ? {
        position: "fixed",
        top: spotlight.top - PADDING,
        left: spotlight.left - PADDING,
        width: spotlight.width + PADDING * 2,
        height: spotlight.height + PADDING * 2,
        borderRadius: 14,
        // 투명한 구멍 + 전면 어두운 오버레이
        boxShadow: `0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 2.5px ${UBCARE_ORANGE}`,
        zIndex: 501,
        pointerEvents: "none",
        transition: "top 0.3s, left 0.3s, width 0.3s, height 0.3s",
      }
    : null;

  // ── 툴팁 위치 계산 ───────────────────────────────────────
  // - spotlight 아래 → 위에 툴팁 (아래 60% 이하)
  // - 그 외 → 아래에 툴팁
  const CARD_W = 300;
  let cardStyle: React.CSSProperties = {};

  if (!spotlight) {
    // 중앙 모달
    cardStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: `min(${CARD_W}px, 90vw)`,
      zIndex: 502,
    };
  } else {
    const spCenterX = spotlight.left + spotlight.width / 2;
    const spBottom = spotlight.top + spotlight.height + PADDING;
    const spTop = spotlight.top - PADDING;
    const inBottomHalf = spotlight.top > window.innerHeight * 0.55;

    const rawLeft = spCenterX - CARD_W / 2;
    const cardLeft = Math.min(Math.max(rawLeft, 12), window.innerWidth - CARD_W - 12);

    if (inBottomHalf) {
      // 스포트라이트 위에 카드
      cardStyle = {
        position: "fixed",
        bottom: window.innerHeight - spTop + 12,
        left: cardLeft,
        width: CARD_W,
        zIndex: 502,
      };
    } else {
      // 스포트라이트 아래에 카드
      cardStyle = {
        position: "fixed",
        top: spBottom + 12,
        left: cardLeft,
        width: CARD_W,
        zIndex: 502,
      };
    }
  }

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 500, opacity: visible ? 1 : 0, transition: "opacity 0.25s" }}
    >
      {/* 스포트라이트 없을 때 전체 어두운 배경 */}
      {!spotlight && (
        <div className="absolute inset-0 bg-black/72" onClick={onClose} />
      )}

      {/* 스포트라이트 (구멍 뚫린 어두운 레이어) */}
      {spotStyle && <div style={spotStyle} />}

      {/* 풀스크린 클릭 인터셉터 (포인터 이벤트 흡수) */}
      {spotlight && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 500, cursor: "default" }}
          onClick={next}
        />
      )}

      {/* 툴팁 카드 */}
      <div
        className="bg-white rounded-2xl shadow-2xl p-5 select-none"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 진행 바 */}
        <div className="flex gap-1.5 mb-4 items-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i <= step ? UBCARE_ORANGE : "#e5e7eb",
                width: i === step ? 24 : 6,
              }}
            />
          ))}
          <span className="ml-auto text-[10px] text-gray-400 font-mono flex-shrink-0">
            {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* 본문 */}
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: "#fff7f0" }}
          >
            {cur.emoji}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1 leading-snug">{cur.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{cur.description}</p>
          </div>
        </div>

        {/* spotlight 힌트 (스포트라이트가 있을 때) */}
        {spotlight && (
          <p className="text-[10px] text-gray-400 mb-3 text-center">
            💡 강조된 영역을 클릭하거나 <span className="font-semibold">다음</span> 버튼을 눌러보세요
          </p>
        )}

        {/* 버튼 */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            건너뛰기
          </button>
          <div className="flex gap-2 flex-shrink-0">
            {!isFirst && (
              <button
                onClick={prev}
                className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: UBCARE_ORANGE }}
            >
              {isLast ? "시작하기 🎉" : "다음 →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
