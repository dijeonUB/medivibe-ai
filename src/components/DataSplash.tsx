"use client";

// ─── 데이터 수집 스플래시 ────────────────────────────────

import { useState, useEffect } from "react";
import Image from "next/image";
import { UBCARE_ORANGE } from "@/constants";

const STEPS_SUPP = [
  "카테고리별 건강식품 데이터를 분석하고 있습니다",
  "국내 판매량 및 성분 정보를 수집하고 있습니다",
  "AI가 최적의 제품을 선별하고 있습니다",
  "추천 목록을 정리하고 있습니다",
];
const STEPS_NEWS = [
  "현재 계절 건강 이슈를 분석하고 있습니다",
  "최신 의학 정보를 수집하고 있습니다",
  "AI가 핵심 건강 정보를 큐레이션하고 있습니다",
  "건강 뉴스를 정리하고 있습니다",
];
const STEPS_INSIGHT = [
  "전체 상담 이력을 불러오고 있습니다",
  "증상 패턴과 반복 진료과를 분석하고 있습니다",
  "AI가 장기 건강 트렌드를 파악하고 있습니다",
  "이력 기반 개인화 리포트를 정리하고 있습니다",
];

interface DataSplashProps {
  type: "supplements" | "news" | "insight";
}

export default function DataSplash({ type }: DataSplashProps) {
  const [dots, setDots] = useState("");
  const [step, setStep] = useState(0);
  const steps = type === "supplements" ? STEPS_SUPP : type === "insight" ? STEPS_INSIGHT : STEPS_NEWS;

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    const stepTimer = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 1800);
    return () => { clearInterval(dotTimer); clearInterval(stepTimer); };
  }, [steps.length]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-12">
      {/* 캐릭터 */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-xl" style={{ borderColor: UBCARE_ORANGE }}>
          <Image src="/chatbot-character.jpg" alt="AI 분석 중" width={96} height={96} className="w-full h-full object-cover" />
        </div>
        {/* 회전 링 */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: UBCARE_ORANGE, animationDuration: "1.2s" }} />
      </div>

      {/* 제목 */}
      <div className="text-center mb-6">
        <p className="text-base font-bold text-gray-900 mb-1">
          {type === "supplements" ? "🤖 AI 건강식품 분석 중" : type === "insight" ? "🤖 AI 건강 이력 분석 중" : "🤖 AI 건강뉴스 수집 중"}
        </p>
        <p className="text-xs text-gray-500">최신 자료를 조회하고 수집하고 있습니다{dots}</p>
      </div>

      {/* 진행 단계 */}
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse"
            style={{ backgroundColor: UBCARE_ORANGE }}>
            <span className="text-white text-xs">✦</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{steps[step]}{dots}</p>
            <div className="mt-2 flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
                  style={{ backgroundColor: i <= step ? UBCARE_ORANGE : "#e5e7eb" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <p className="mt-5 text-[11px] text-gray-400 text-center leading-relaxed">
        Claude AI가 실시간으로 데이터를 분석합니다<br />잠시만 기다려 주세요 (약 5~10초)
      </p>
    </div>
  );
}
