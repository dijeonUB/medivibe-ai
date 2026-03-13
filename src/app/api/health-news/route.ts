import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 건강 의학 전문 에디터입니다.
현재 계절과 월에 맞는 건강 정보를 아래 JSON 형식으로만 제공하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "season": "봄|여름|가을|겨울",
  "weatherAlert": "현재 계절의 주요 날씨·환경 건강 이슈 한 줄",
  "articles": [
    {
      "id": 1,
      "category": "계절병|미세먼지|영양관리|면역력|생활습관",
      "categoryColor": "#hex색상코드",
      "title": "건강 정보 제목 (관심을 끄는 제목)",
      "summary": "2~3줄 핵심 요약",
      "symptoms": ["주의증상1", "주의증상2", "주의증상3"],
      "preventionTips": ["예방법1", "예방법2", "예방법3"],
      "recommendedFoods": ["추천음식1", "추천음식2", "추천음식3"],
      "urgencyLevel": "주의 또는 보통"
    }
  ]
}

카테고리별 색상 기준:
- 계절병: #ef4444
- 미세먼지: #f97316
- 영양관리: #22c55e
- 면역력: #3b82f6
- 생활습관: #8b5cf6

5개 기사를 작성하세요. 실제 한국의 계절별 건강 정보를 기반으로 실용적인 내용을 담아주세요.`;

export async function POST(req: Request) {
  try {
    const { month } = await req.json();
    const seasonMap: Record<number, string> = {
      1: "겨울", 2: "겨울", 3: "봄", 4: "봄", 5: "봄",
      6: "여름", 7: "여름", 8: "여름", 9: "가을", 10: "가을",
      11: "가을", 12: "겨울",
    };
    const season = seasonMap[month] ?? "봄";

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `현재 ${month}월 ${season} 시즌입니다. 이 시기 한국에서 주의해야 할 건강 정보 5개를 제공해주세요.`,
      }],
    });
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON 파싱 실패");
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("건강뉴스 오류:", error);
    return Response.json({ error: "뉴스를 불러오지 못했습니다." }, { status: 500 });
  }
}
