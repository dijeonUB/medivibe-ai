import { describe, it, expect } from "vitest";

// ─── 계절 매핑 유틸 ───────────────────────────────────────────
const seasonMap: Record<number, string> = {
  1: "겨울", 2: "겨울", 3: "봄", 4: "봄", 5: "봄",
  6: "여름", 7: "여름", 8: "여름", 9: "가을", 10: "가을",
  11: "가을", 12: "겨울",
};
function getSeason(month: number): string {
  return seasonMap[month] ?? "봄";
}

describe("계절 매핑", () => {
  it("3~5월은 봄", () => {
    expect(getSeason(3)).toBe("봄");
    expect(getSeason(4)).toBe("봄");
    expect(getSeason(5)).toBe("봄");
  });
  it("6~8월은 여름", () => {
    expect(getSeason(6)).toBe("여름");
    expect(getSeason(7)).toBe("여름");
    expect(getSeason(8)).toBe("여름");
  });
  it("9~11월은 가을", () => {
    expect(getSeason(9)).toBe("가을");
    expect(getSeason(10)).toBe("가을");
    expect(getSeason(11)).toBe("가을");
  });
  it("12, 1, 2월은 겨울", () => {
    expect(getSeason(12)).toBe("겨울");
    expect(getSeason(1)).toBe("겨울");
    expect(getSeason(2)).toBe("겨울");
  });
  it("범위 밖 값은 기본값 봄", () => {
    expect(getSeason(99)).toBe("봄");
  });
});

// ─── 카테고리 색상 매핑 ────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  "계절병": "#ef4444",
  "미세먼지": "#f97316",
  "영양관리": "#22c55e",
  "면역력": "#3b82f6",
  "생활습관": "#8b5cf6",
};

describe("뉴스 카테고리 색상", () => {
  it("모든 카테고리에 hex 색상 코드가 정의됨", () => {
    Object.values(CATEGORY_COLORS).forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
  it("면역력 카테고리는 파란색 계열", () => {
    expect(CATEGORY_COLORS["면역력"]).toBe("#3b82f6");
  });
});

// ─── 텍스트 truncation 유틸 ────────────────────────────────────
function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) : text;
}

describe("텍스트 잘라내기", () => {
  it("maxLen 이하 문자열은 그대로 반환", () => {
    expect(truncate("신경과", 4)).toBe("신경과");
  });
  it("maxLen 초과 문자열은 잘라냄", () => {
    expect(truncate("이비인후과", 4)).toBe("이비인후");
  });
});
