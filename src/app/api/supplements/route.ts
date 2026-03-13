import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 건강기능식품 전문가입니다.
사용자가 요청한 카테고리와 정렬 기준에 따라 한국에서 인기 있는 건강기능식품을 추천해주세요.
반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "categoryInfo": "해당 카테고리에 대한 설명 1줄",
  "products": [
    {
      "rank": 1,
      "name": "제품명",
      "brand": "브랜드명",
      "mainBenefit": "핵심 효능 한 줄 (식약처 기능성 기준)",
      "benefits": ["세부효능1", "세부효능2", "세부효능3"],
      "priceRange": "15,000~25,000원",
      "unit": "30일분(60캡슐)",
      "searchKeyword": "네이버쇼핑/쿠팡 검색용 키워드",
      "tags": ["식약처인증", "국내산", "무설탕"]
    }
  ]
}

정렬 기준:
- popular: 국내 판매량·인기 높은 순 (주요 브랜드 위주)
- priceLow: 가격 낮은 순 (10,000~20,000원대 제품 우선)
- priceHigh: 프리미엄·고가 순 (30,000원 이상 고품질 제품 우선)

10개 제품을 추천하세요. GC녹십자, 종근당건강, 일동제약, 유한양행, CJ웰케어, 뉴트리코어, 네이처메이드, 솔가, 한미약품, 동아제약 등 국내외 유명 제약·건강기능식품 브랜드 중심으로 추천하세요.`;

export async function POST(req: Request) {
  try {
    const { category, sortBy } = await req.json();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `카테고리: ${category}, 정렬: ${sortBy}. 건강기능식품 10개를 추천해주세요.`,
      }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON 파싱 실패");
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("건강식품 추천 오류:", error);
    return Response.json({ error: "추천 중 오류가 발생했습니다." }, { status: 500 });
  }
}
