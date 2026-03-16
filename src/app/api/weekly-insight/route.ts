import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 UBcare 의료정보 분석 AI입니다.
사용자의 전체 건강 상담 이력을 분석하여 장기 건강 패턴과 평균 통계를 아래 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.

{
  "period": "분석 기간 문자열 (예: 2024.01 ~ 2026.03, 총 N개월)",
  "totalSessions": 전체_세션_수,
  "averagePerMonth": 월평균_상담_횟수_소수점1자리,
  "topKeywords": [
    { "keyword": "키워드", "count": 전체_기간_등장_횟수 }
  ],
  "departmentStats": [
    { "department": "진료과명", "count": 전체_횟수 }
  ],
  "urgencyBreakdown": [
    { "level": "일반|주의|응급", "count": 전체_횟수 }
  ],
  "symptomTimeline": [
    { "date": "YYYY-MM (월 단위)", "symptoms": ["그달 주요 증상1", "증상2"] }
  ],
  "recommendations": [
    "이력 기반 개인화 건강 추천사항 (반복 패턴에 근거한 구체적 조언)"
  ],
  "overallAssessment": "장기 건강 패턴 종합 평가 2~3줄 — 자주 아픈 계절/시기, 반복 증상, 주의 사항 포함"
}

분석 시 주의사항:
- topKeywords: 제목에서 핵심 증상·키워드 추출, 전체 기간 빈도 기준 최대 10개
- departmentStats: 가장 많이 방문한 진료과 순, 최대 6개
- urgencyBreakdown: 긴급도별 집계 (없는 등급 제외)
- symptomTimeline: 월 단위 집계 (상담 없는 달 제외), 최대 12개월치
- averagePerMonth: 전체 세션 수 ÷ 기록 기간(개월 수), 소수점 1자리
- recommendations: 반복 패턴(같은 증상, 특정 계절 집중 등)에 기반한 3~5개 실용 조언
- 세션이 적을수록 overallAssessment에서 "데이터 축적 시 더 정확한 분석 가능" 언급`;

export async function POST(req: Request) {
  try {
    const { sessions } = await req.json();

    // 세션이 없으면 기본 응답
    if (!sessions || sessions.length === 0) {
      return Response.json({
        period: "",
        totalSessions: 0,
        averagePerMonth: 0,
        topKeywords: [],
        departmentStats: [],
        urgencyBreakdown: [],
        symptomTimeline: [],
        recommendations: ["AI 상담을 시작하면 개인화된 건강 이력 분석이 생성됩니다."],
        overallAssessment: "아직 분석할 상담 기록이 없습니다. AI 건강 상담을 이용해보세요.",
      });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `다음은 전체 건강 상담 이력입니다 (총 ${sessions.length}건):\n\n${JSON.stringify(sessions, null, 2)}\n\n이 장기 이력을 분석하여 건강 패턴 인사이트를 제공해주세요.`,
      }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON 파싱 실패");
    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error("건강 이력 분석 오류:", error);
    return Response.json({ error: "인사이트를 생성하지 못했습니다." }, { status: 500 });
  }
}
