import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 증상이 감지되면 응답 마지막에 구조화 데이터를 포함하도록 지시
const SYSTEM_PROMPT = `당신은 유비케어의 AI 의료 정보 어시스턴트입니다.

역할:
1. 의료 용어를 누구나 이해할 수 있는 쉬운 말로 설명합니다.
2. 건강 관련 질문에 정확하고 친절하게 답변합니다.
3. 증상 관련 질문에는 정보를 제공하되 전문 의료진 상담을 권고합니다.
4. 항상 한국어로 답변합니다.
5. 답변은 간결하고 명확하게 제공합니다.

[중요 규칙]
사용자가 신체 증상(통증, 발열, 기침, 두통, 복통 등 몸이 아프다는 내용)을 언급하면,
정상적인 답변을 한 후 맨 마지막 줄에 반드시 아래 형식을 정확히 추가하세요.
다른 텍스트 없이 한 줄로 작성하세요:

[SYMPTOM_DATA]{"department":"진료과명","urgency":"일반","searchKeyword":"진료과명 병원","urgencyReason":"한 줄 이유"}[/SYMPTOM_DATA]

urgency 기준:
- "일반": 일반 외래로 충분
- "주의": 빠른 진료 필요
- "응급": 즉시 응급실 방문

단순 의료 정보 질문(증상 없음)이면 이 블록을 포함하지 마세요.
이 서비스는 의료 조언이 아닌 정보 제공 목적입니다.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("API 오류:", error);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
