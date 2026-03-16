import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 따뜻하고 친근한 개인 건강 도우미 AI입니다.
사용자의 최근 상담 기록을 바탕으로 아침 건강 브리핑을 아래 JSON 형식으로만 제공하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "greeting": "따뜻한 아침 인사 (1문장, 최근 건강 상태 언급 포함)",
  "recentSummary": "최근 상담 요약 (있으면 1~2문장, 없으면 null)",
  "seasonalTip": "계절별 건강 팁 1문장",
  "todayAdvice": "오늘 실천할 건강 조언 1문장 (구체적으로)",
  "quickCheckItems": [
    "오늘 확인할 건강 체크 항목 (3~4개, 간결하게)"
  ]
}

작성 원칙:
- 따뜻하고 친근한 말투 사용 (딱딱하지 않게)
- 최근 상담 기록이 있으면 그 내용과 연결
- 기록이 없으면 계절 팁과 일반 건강 조언만 제공
- quickCheckItems는 "오늘 물 8잔 마시기" 같은 실천 가능한 항목으로`;

export async function POST(req: Request) {
  try {
    const { recentSessions, month } = await req.json();

    const seasonMap: Record<number, string> = {
      1: "겨울", 2: "겨울", 3: "봄", 4: "봄", 5: "봄",
      6: "여름", 7: "여름", 8: "여름", 9: "가을", 10: "가을",
      11: "가을", 12: "겨울",
    };
    const season = seasonMap[month] ?? "봄";

    const hasRecent = recentSessions && recentSessions.length > 0;
    const userContent = hasRecent
      ? `현재 ${month}월 ${season} 시즌입니다.\n\n최근 3일 상담 기록:\n${JSON.stringify(recentSessions, null, 2)}\n\n위 기록을 참고하여 오늘 아침 건강 브리핑을 작성해주세요.`
      : `현재 ${month}월 ${season} 시즌입니다. 상담 기록이 없으니 계절 건강 팁과 일반적인 건강 조언으로 브리핑을 작성해주세요.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON 파싱 실패");
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("아침 브리핑 오류:", error);
    return Response.json({ error: "브리핑을 생성하지 못했습니다." }, { status: 500 });
  }
}
