import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `당신은 유비케어의 의료 전문 AI 어시스턴트입니다.
사용자가 증상을 설명하면 반드시 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "department": "진료과명 (예: 내과, 정형외과, 이비인후과 등)",
  "departmentEng": "영문 진료과명",
  "reason": "이 진료과를 추천하는 이유 (2~3문장)",
  "urgency": "일반 또는 주의 또는 응급",
  "urgencyReason": "긴급도 판단 근거 (1문장)",
  "cautions": ["주의사항1", "주의사항2", "주의사항3"],
  "searchKeyword": "카카오맵/네이버지도 검색용 키워드 (예: 내과 병원)"
}

긴급도 기준:
- 일반: 일반적인 외래 진료로 충분한 경우
- 주의: 빠른 시일 내 진료가 필요한 경우
- 응급: 즉각적인 응급실 방문이 필요한 경우`;

export async function POST(req: Request) {
  try {
    const { symptoms } = await req.json();

    if (!symptoms?.trim()) {
      return Response.json({ error: "증상을 입력해주세요." }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `다음 증상을 분석해주세요: ${symptoms}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON 파싱 실패");
    }

    const result = JSON.parse(jsonMatch[0]);
    return Response.json(result);
  } catch (error) {
    console.error("증상 분석 오류:", error);
    return Response.json({ error: "분석 중 오류가 발생했습니다." }, { status: 500 });
  }
}
