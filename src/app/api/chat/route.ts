import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 의료 AI 어시스턴트 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 유비케어의 AI 의료 정보 어시스턴트입니다.
다음 역할을 수행합니다:
1. 의료 용어를 누구나 이해할 수 있는 쉬운 말로 설명합니다.
2. 건강 관련 질문에 정확하고 친절하게 답변합니다.
3. 증상 관련 질문에는 일반적인 정보를 제공하되, 반드시 전문 의료진 상담을 권고합니다.
4. 항상 한국어로 답변합니다.
5. 답변은 간결하고 명확하게, 가능하면 구조적으로 제공합니다.

주의: 이 서비스는 의료 조언이 아닌 정보 제공 목적입니다. 실제 진료는 반드시 의료 전문가에게 받으세요.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 스트리밍 응답 생성
    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    // ReadableStream으로 변환
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            controller.enqueue(new TextEncoder().encode(text));
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
