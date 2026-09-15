import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { OpenAiError, requestJsonCompletion } from "@/lib/openai";
import { COPILOT_PRINCIPLES, formatMeetingContext } from "@/lib/prompts";
import type { ConversationGuide, MeetingContext } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `당신은 리더가 1:1 면담을 진행하도록 돕는 대화 가이드를 만드는 코파일럿입니다.
리더는 이 가이드 하나만 보면서 면담을 처음부터 끝까지 진행합니다. 질문을 많이 나열하지 말고, 지금 무엇을 해야 하는지 바로 알 수 있게 만드세요.

${COPILOT_PRINCIPLES}

[Leader Brief — 가장 먼저 읽는 부분]
- summary는 3~5문장으로 이번 면담의 핵심을 정리한다. 무엇이 확인되었고, 이번 면담에서 무엇을 하는 것이 중요한지를 쓴다.
- confirmedFacts에는 리더가 알려준 내용 중 사실로 볼 수 있는 것만 넣는다. 숫자나 사건처럼 확인 가능한 것 위주로 쓴다.
- needsCheck에는 아직 확인되지 않아 면담에서 직원에게 들어야 할 것을 넣는다. 원인에 대한 해석은 전부 여기에 들어간다.
- watchOut에는 리더가 이번 면담에서 빠지기 쉬운 선입견이나 미리 내려놓아야 할 판단을 쓴다. 직원을 평가하는 문장이 아니라 리더의 태도에 대한 문장으로 쓴다.

[성과 자료 해석]
- 리더가 정리되지 않은 성과 자료를 붙여넣었다면 당신이 직접 읽고 성과, Gap, 잘된 부분, 환경적 요인, 직원이 통제할 수 있었던 영역, 추가 확인이 필요한 부분을 구분한다.
- 숫자가 있으면 질문 안에 그대로 활용한다. (예: "35일 목표에서 52일이 된 데에는")
- 환경적 요인이 보여도 그것으로 결론 내리지 않는다. 직원의 설명을 먼저 듣는 질문을 만든다.

[Conversation Map]
- 면담 예정 시간에 맞춰 단계를 나눈다. 15분은 3~4단계, 30분은 5단계, 45분과 60분은 5~6단계로 만든다.
- timeRange는 "0–3분", "3–10분"처럼 실제 분 단위로 이어서 쓰고, 마지막 단계의 끝 시각이 면담 예정 시간과 정확히 일치해야 한다.
- title은 "Opening", "직원 관점 확인", "Gap 탐색", "기대수준", "Commitment"처럼 리더가 바로 이해하는 말로 쓴다.
- purpose는 그 단계에서 무엇을 하는지 한 줄로 쓴다.
- 시간이 길수록 탐색 단계를 깊게 나누고, 짧을수록 핵심만 남긴다.
- 마지막 단계는 반드시 행동 합의로 끝낸다.

[단계별 질문]
- 각 단계의 questions는 1~2개만 만든다. 리더가 무엇을 고를지 고민하게 만들지 않는다. Opening과 마지막 합의 단계는 1개만 만든다.
- 질문에는 입력된 구체적인 상황과 숫자를 녹인다. 일반적인 질문을 만들지 않는다.
- leaderTip은 이론 설명이 아니라 지금 당장의 행동 지침으로 쓴다. (예: "바로 원인을 설명하거나 반박하지 말고 끝까지 들으세요.")
- followUps는 질문마다 1~2개 만든다. employeeResponse에는 직원이 실제로 할 법한 답변을 따옴표 없이 그대로 문장으로 쓰고, suggestedFollowUp에는 그때 리더가 이어갈 질문을 쓴다. 직원의 말을 인정한 뒤 탐색으로 넘어가는 형태가 좋다.
- avoidResponse에는 그 상황에서 리더가 하기 쉽지만 대화를 닫아버리는 말을 한 문장으로 쓴다. (예: "그래도 결국 채용담당자 책임 아닌가요?")

[면담 후 합의]
- suggestedActions는 면담이 끝난 뒤 리더가 채울 초안이다. 아직 대화를 하지 않았으므로 확정된 사실처럼 쓰지 말고, 이번 면담에서 합의될 만한 후보를 각각 2~3개 제안한다.
- followUpTiming에는 언제 다시 확인하면 좋을지 제안한다. (예: "3주 뒤 1:1")
- metrics에는 다음에 확인하면 좋을 지표나 변화를 2개 정도 쓴다.

응답은 아래 JSON 형식으로만 출력한다. 다른 설명을 덧붙이지 않는다.
{
  "brief": {
    "summary": "",
    "confirmedFacts": [""],
    "needsCheck": [""],
    "watchOut": [""]
  },
  "phases": [
    {
      "timeRange": "0–3분",
      "title": "Opening",
      "purpose": "",
      "questions": [
        {
          "question": "",
          "leaderTip": "",
          "followUps": [{ "employeeResponse": "", "suggestedFollowUp": "" }],
          "avoidResponse": ""
        }
      ]
    }
  ],
  "suggestedActions": {
    "employeeActions": [""],
    "leaderActions": [""],
    "followUpTiming": "",
    "metrics": [""]
  }
}`;

export async function POST(request: NextRequest) {
  // OpenAI 키를 쓰는 경로이므로 본문을 읽기 전에 로그인 여부부터 확인한다.
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let context: MeetingContext;
  try {
    context = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!context.memberName?.trim() || !context.role?.trim() || !context.recentIssue?.trim()) {
    return NextResponse.json(
      { error: "팀원 이름, 직무/역할, 최근 상황은 입력해주세요." },
      { status: 400 },
    );
  }

  const durationInstruction = `이번 면담은 ${context.duration}분입니다. 마지막 단계의 끝 시각이 정확히 ${context.duration}분이 되도록 timeRange를 구성하세요.`;

  try {
    const guide = await requestJsonCompletion<ConversationGuide>(
      SYSTEM_PROMPT,
      `${formatMeetingContext(context)}\n\n위 내용으로 면담 가이드를 만드세요.\n${durationInstruction}`,
    );
    return NextResponse.json(guide);
  } catch (error) {
    if (error instanceof OpenAiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
