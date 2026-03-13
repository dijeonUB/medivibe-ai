// ─── 컴포넌트 렌더링 테스트 ──────────────────────────────────
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmDialog from "@/components/ConfirmDialog";
import HospitalCard from "@/components/HospitalCard";
import type { SymptomData } from "@/types";

// ── ConfirmDialog ─────────────────────────────────────────────
describe("<ConfirmDialog />", () => {
  const defaultProps = {
    message: "정말 삭제하시겠습니까?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it("message prop을 화면에 표시한다", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("정말 삭제하시겠습니까?")).toBeTruthy();
  });

  it("'삭제하기' 버튼이 렌더링된다", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: "삭제하기" })).toBeTruthy();
  });

  it("'취소' 버튼이 렌더링된다", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole("button", { name: "취소" })).toBeTruthy();
  });

  it("'삭제하기' 클릭 시 onConfirm이 호출된다", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "삭제하기" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("'취소' 클릭 시 onCancel이 호출된다", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("'삭제 확인' 제목이 표시된다", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("삭제 확인")).toBeTruthy();
  });
});

// ── HospitalCard ──────────────────────────────────────────────
describe("<HospitalCard />", () => {
  const normalData: SymptomData = {
    department: "내과",
    urgency: "일반",
    searchKeyword: "내과 병원",
    urgencyReason: "가벼운 발열 증상입니다.",
  };

  const urgentData: SymptomData = {
    department: "응급실",
    urgency: "응급",
    searchKeyword: "응급실",
    urgencyReason: "심한 흉통과 호흡 곤란",
  };

  it("추천 진료과를 화면에 표시한다", () => {
    render(<HospitalCard data={normalData} />);
    expect(screen.getByText(/내과/)).toBeTruthy();
  });

  it("urgency 배지(일반)를 표시한다", () => {
    render(<HospitalCard data={normalData} />);
    expect(screen.getAllByText("일반").length).toBeGreaterThanOrEqual(1);
  });

  it("urgencyReason 텍스트를 표시한다", () => {
    render(<HospitalCard data={normalData} />);
    expect(screen.getByText("가벼운 발열 증상입니다.")).toBeTruthy();
  });

  it("카카오맵 링크가 searchKeyword를 포함한다", () => {
    render(<HospitalCard data={normalData} />);
    const kakaoLink = screen.getByText("🗺️ 카카오맵").closest("a") as HTMLAnchorElement;
    expect(kakaoLink.href).toContain(encodeURIComponent("내과 병원"));
  });

  it("네이버지도 링크가 searchKeyword를 포함한다", () => {
    render(<HospitalCard data={normalData} />);
    const naverLink = screen.getByText("🗺️ 네이버지도").closest("a") as HTMLAnchorElement;
    expect(naverLink.href).toContain(encodeURIComponent("내과 병원"));
  });

  it("응급 상황에서 119 신고 버튼을 표시한다", () => {
    render(<HospitalCard data={urgentData} />);
    expect(screen.getByText(/119 응급 신고/)).toBeTruthy();
  });

  it("일반 상황에서 119 신고 버튼을 표시하지 않는다", () => {
    render(<HospitalCard data={normalData} />);
    expect(screen.queryByText(/119 응급 신고/)).toBeNull();
  });

  it("urgencyReason이 없으면 해당 영역을 표시하지 않는다", () => {
    const noReasonData = { ...normalData, urgencyReason: "" };
    render(<HospitalCard data={noReasonData} />);
    expect(screen.queryByText("가벼운 발열 증상입니다.")).toBeNull();
  });
});
