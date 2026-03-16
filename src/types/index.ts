// ─── 앱 공통 타입 정의 ───────────────────────────────────

export type ViewType = "chat" | "records" | "supplements" | "news" | "insight";

export interface SymptomData {
  department: string;
  urgency: "일반" | "주의" | "응급";
  searchKeyword: string;
  urgencyReason: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  symptomData?: SymptomData;
}

export interface HealthSession {
  id: string;
  date: string;
  createdAt: string;
  title: string;
  messages: Message[];
  symptomData?: SymptomData;
}

export interface SupplementProduct {
  rank: number;
  name: string;
  brand: string;
  mainBenefit: string;
  benefits: string[];
  priceRange: string;
  unit: string;
  searchKeyword: string;
  tags: string[];
}

export interface SupplementsData {
  products: SupplementProduct[];
  categoryInfo: string;
}

export interface NewsArticle {
  id: number;
  category: string;
  categoryColor: string;
  title: string;
  summary: string;
  symptoms: string[];
  preventionTips: string[];
  recommendedFoods: string[];
  urgencyLevel: string;
}

export interface NewsData {
  season: string;
  weatherAlert: string;
  articles: NewsArticle[];
}

export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// ─── API 전송용 경량 세션 요약 타입 ──────────────────────
export interface SessionSummary {
  date: string;
  title: string;
  department?: string;
  urgency?: string;
  urgencyReason?: string;
  messageCount: number;
}

// ─── 건강 이력 인사이트 데이터 ───────────────────────────
export interface HealthInsightData {
  period: string;
  totalSessions: number;
  averagePerMonth: number;
  topKeywords: { keyword: string; count: number }[];
  departmentStats: { department: string; count: number }[];
  urgencyBreakdown: { level: string; count: number }[];
  symptomTimeline: { date: string; symptoms: string[] }[];
  recommendations: string[];
  overallAssessment: string;
}

// ─── 아침 건강 브리핑 데이터 ─────────────────────────────
export interface MorningBriefingData {
  greeting: string;
  recentSummary?: string;
  seasonalTip: string;
  todayAdvice: string;
  quickCheckItems: string[];
}
