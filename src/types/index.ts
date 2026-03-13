// ─── 앱 공통 타입 정의 ───────────────────────────────────

export type ViewType = "chat" | "records" | "supplements" | "news";

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
