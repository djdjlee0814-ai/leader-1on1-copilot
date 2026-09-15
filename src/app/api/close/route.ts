import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { OpenAiError, requestJsonCompletion } from "@/lib/openai";
import { COPILOT_PRINCIPLES, formatConversationState } from "@/lib/prompts";
import type { CloseSummary, ConversationState } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const SYSTEM_PROMPT = `당신은 1:1 면담이 끝난 직후, 오간 대화를 정리해 주는 AI 코파일럿입니다.

${COPILOT_PRINCIPLES}

[정리 원칙]
- 대화에서 나오지 않은 내용을 새로 만들어내지 않는다. 기록된 발언과 확인된 사실만 사용한다.
- confirmedIssues에는 대화 중 실제로 확인된 문제나 원인만 넣는다. 아직 가설 단계인 것은 unresolved에 넣는다.
- employeeActions와 managerActions는 "무엇을 언제까지"가 드러나는 한 문장으로 쓴다. 합의된 행동이 없으면 빈 배열로 둔다.
- followUpTiming에는 언제 다시 확인하기로 했는지 쓴다. 대화에 없으면 적절한 시점을 제안한다. (예: "3주 뒤 1:1")
- metrics에는 다음에 확인할 지표나 변화를 2개 정도 쓴다.
- discussionSummary는 3~4문장으로 쓴다. 직원에 대한 평가나 단정이 아니라 오간 내용 중심으로 쓴다.

[면담 유형이 "성과면담"인 경우]
- gradeBasis에 등급을 판단할 때 참고할 사실만 3~5개 정리한다. 목표와 실제 결과를 비교한 내용, 면담에서 확인된 원인과 기여 요인을 중심으로 쓴다.
- 등급(S/A/B/C/D)을 제안하거나 예측하거나 암시하지 않는다. 등급은 리더가 직접 결정한다.
- developmentPlan은 null로 둔다.

[면담 유형이 "성장·육성면담"인 경우]
- developmentPlan을 채운다. strengths(확인된 강점), developmentAreas(개발이 필요한 역량), trainings(필요한 교육이나 학습 방법), directions(육성 방향), leaderSupport(리더가 지원할 것)를 각각 2~4개씩 쓴다.
- trainings와 directions는 직무와 상황에 맞게 구체적으로 쓴다. 대화에서 확인된 내용을 우선하되, 직무상 현실적인 방법을 제안할 수 있다.
- gradeBasis는 빈 배열로 둔다.

응답은 아래 JSON 형식으로만 출력한다. 다른 설명을 덧붙이지 않는다.
{
  "discussionSummary": "",
  "confirmedIssues": [""],
  "unresolved": [""],
  "employeeActions": [""],
  "managerActions": [""],
  "followUpTiming": "",
  "metrics": [""],
  "gradeBasis": ["1단계 성과평가일 때만 채운다. 목표 대비 결과와 확인된 원인을 사실로 3~5개"],
  "developmentPlan": {
    "strengths": ["2단계 육성면담일 때만 채운다"],
    "developmentAreas": [""],
    "trainings": [""],
    "directions": [""],
    "leaderSupport": [""]
  }
}`;

export async function POST(request: NextRequest) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let state: ConversationState;
  try {
    state = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!state?.meetingContext) {
    return NextResponse.json({ error: "면담 정보가 없습니다." }, { status: 400 });
  }

  try {
    const isPerformance = state.meetingContext.track === "performance";
    const trackInstruction = isPerformance
      ? `이 면담은 "성과면담"입니다. gradeBasis를 반드시 3~5개 채우세요. 목표와 실제 결과의 차이, 면담에서 확인된 원인과 기여 요인을 사실로 정리하세요. 등급(S/A/B/C/D)은 제안하지 말고 developmentPlan은 null로 두세요.`
      : `이 면담은 "성장·육성면담"입니다. developmentPlan의 다섯 항목을 각각 2~4개씩 반드시 채우세요. gradeBasis는 빈 배열로 두세요.`;

    const summary = await requestJsonCompletion<CloseSummary>(
      SYSTEM_PROMPT,
      `${formatConversationState(state)}\n\n위 면담을 정리하세요.\n${trackInstruction}`,
    );
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof OpenAiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
