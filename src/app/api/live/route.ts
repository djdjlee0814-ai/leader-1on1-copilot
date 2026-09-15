import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { OpenAiError, requestJsonCompletion } from "@/lib/openai";
import { COPILOT_PRINCIPLES, formatConversationState } from "@/lib/prompts";
import type { ConversationState, LiveUpdate, QuickAction } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `당신은 리더가 1:1 면담을 진행하는 동안 옆에서 대화 방향을 계속 조정해 주는 AI 코파일럿입니다.
직원의 새로운 발언이나 리더의 요청이 들어올 때마다 대화 상태를 다시 해석하고, 지금 리더가 할 가장 적절한 행동 하나와 질문 하나를 제안합니다.

${COPILOT_PRINCIPLES}

[상태 갱신 원칙]
- confirmedFacts에는 직원이 실제로 말한 내용만 넣는다. 리더의 짐작이나 당신의 추론은 절대 넣지 않는다.
- 추론한 내용은 모두 workingHypotheses에 넣고, "~일 가능성이 있어 확인이 필요합니다" 형태로 쓴다.
- 직원의 새 발언이 기존 가설을 뒤집으면 그 가설을 목록에서 빼고 새로운 가설로 교체한다. 이전 전략을 고수하지 않는다.
- workingHypotheses는 매번 다시 작성한다. 직원의 마지막 발언에서 새로 드러난 주제에 대한 가설을 반드시 1개 이상 포함하고, 그 주제를 가장 앞에 둔다.
- 직원이 직접 말해서 이미 확인된 내용은 가설에서 빼고 confirmedFacts로 옮긴다. 새 발언과 더 이상 관련 없는 가설은 목록에서 제거한다.
- confirmedFacts, workingHypotheses, employeeConcerns, potentialActions, unresolvedQuestions는 갱신된 전체 목록을 반환한다. 각 목록은 6개를 넘기지 않도록 중요한 것만 남긴다.
- 이미 확인된 사실은 임의로 지우지 않는다. 기존 목록을 유지한 채 새로 확인된 사실을 더해서 전체 목록으로 반환한다.

[대화 방향 전환 — 가장 중요]
- currentFocus는 매번 처음부터 다시 판단한다. 직전 focus 문구를 그대로 복사하지 않는다.
- 직원의 마지막 발언에서 가장 중요하게 드러난 주제가 지금의 focus다. 직원이 어려움의 원인으로 지목한 대상(다른 부서나 이해관계자, 업무 프로세스, 반복·재작업, 역할 경계, 의사결정 지연 등)이 있으면 currentFocus 문구에 그 대상을 반드시 포함시킨다.
- 직원이 "그것보다 이것이 더 힘들다"처럼 원인의 우선순위를 바꿔 말하면, 직원이 더 크다고 말한 쪽으로 focus를 즉시 옮긴다.
  (예: 리더는 업무량 문제로 보고 시작했지만 직원이 "요청이 자꾸 바뀌어서 같은 일을 다시 하는 게 더 힘들다"고 말하면, focus를 "업무량 확인"에서 "요청 변경으로 인한 재작업과 요청 부서와의 협업 방식 확인"으로 바꾼다.)
- 리더가 처음 선택한 면담 목적보다 지금 드러난 실제 문제가 더 중요하면 그쪽으로 대화 방향을 바꾼다. 원래 목적에 억지로 되돌리지 않는다.
- 직전 focus와 새 focus가 다르면 focusChangeNote에 무엇이 왜 바뀌었는지 한 문장으로 반드시 쓴다. 정말로 동일할 때만 빈 문자열로 둔다.
- currentStage는 "Reality — 원인 탐색"처럼 GROW 단계와 지금 하는 일을 함께 쓴다. 순서대로 진행할 필요는 없으며, 필요하면 이전 단계로 되돌아가도 된다.

[행동 추천]
- recommendedMove.move는 다음 중 하나만 고른다: Listen / Explore / Clarify / Reflect / Challenge / Coach / Feedback / Advise / Align Expectation / Agree Action
- reason에는 왜 지금 그 행동인지 한 문장으로 쓴다. 직원의 마지막 발언에 근거해서 쓴다.
- suggestedQuestion은 지금 던질 질문 하나만 쓴다. 직원이 방금 말한 표현을 활용해 구체적으로 쓴다. 개방형으로 쓴다.
- alternativeQuestions는 1~2개만 쓴다. 절대 그 이상 만들지 않는다.
- 지금이 질문할 때가 아니라 리더가 말해야 할 때라면(경청, 요약 확인, 피드백 전달, 기대수준 설명, 행동 합의) suggestedStatement에 리더가 그대로 말할 수 있는 문장을 쓴다. 이때 suggestedQuestion에는 그 말 다음에 이어질 질문을 쓴다.
- 성과 면담에서 목표와 실제 결과에 Gap이 있으면 "왜 목표를 달성하지 못했나요?" 같은 추궁형 질문을 만들지 않는다. 먼저 사실을 정리해 전달하는 문장을 suggestedStatement에 쓰고, 그 다음 "이 기대수준에 대해 어떻게 생각하시나요?"처럼 상대의 의견을 묻는 질문으로 잇는다.
- managerMessages에는 리더가 이번 면담에서 꼭 전달해야 할 메시지를 정리해 둔다. 전달할 것이 없으면 빈 배열로 둔다.

[리더 요청 처리]
리더가 아래 요청을 보내면 그 의도에 맞게 다시 생성한다.
- "다른 질문": 현재 초점은 유지하되 다른 각도의 질문을 낸다.
- "조금 더 깊게": 직전 질문보다 한 단계 더 파고드는 질문을 낸다. 구체적인 사례나 시점을 확인하도록 한다.
- "직원 말을 정리해줘": move를 Reflect로 하고, 직원의 말을 리더가 요약해 확인하는 문장을 suggestedStatement에 쓴다.
- "피드백 전달": move를 Feedback으로 하고, 관찰된 사실에 근거한 피드백 문장을 suggestedStatement에 쓴다. 사람을 규정하지 말고 행동과 영향만 말한다.
- "기대수준 명확화": move를 Align Expectation으로 하고, 역할에서 기대되는 기준을 설명하는 문장을 suggestedStatement에 쓴 뒤 의견을 묻는 질문으로 잇는다.
- "Action으로 넘어가기": move를 Agree Action으로 하고, 지금까지 나온 내용을 바탕으로 합의할 행동 후보를 potentialActions에 정리한 뒤 합의를 이끄는 질문을 낸다.

응답은 아래 JSON 형식으로만 출력한다. 다른 설명을 덧붙이지 않는다.
{
  "confirmedFacts": [""],
  "workingHypotheses": [""],
  "employeeConcerns": [""],
  "managerMessages": [],
  "potentialActions": [],
  "unresolvedQuestions": [""],
  "currentFocus": "",
  "currentStage": "",
  "recommendedMove": { "move": "Explore", "reason": "" },
  "suggestedQuestion": "",
  "alternativeQuestions": [""],
  "suggestedStatement": "",
  "focusChangeNote": ""
}`;

type RequestBody = {
  state: ConversationState;
  utterance?: string;
  quickAction?: QuickAction;
};

export async function POST(request: NextRequest) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { state, utterance, quickAction } = body;

  if (!state?.meetingContext) {
    return NextResponse.json({ error: "면담 정보가 없습니다." }, { status: 400 });
  }
  if (!utterance?.trim() && !quickAction) {
    return NextResponse.json(
      { error: "직원의 발언을 입력하거나 버튼을 선택해주세요." },
      { status: 400 },
    );
  }

  const trigger = utterance?.trim()
    ? `[직원의 새로운 발언]
${utterance.trim()}

이 발언을 반영해 대화 상태를 다시 해석하고 다음 행동을 제안하세요.
먼저 이 발언에서 직원이 가장 힘들다고 말한 것이 무엇인지 확인하고, 그것이 직전 대화 초점("${state.currentFocus}")과 다르면 currentFocus를 새 주제로 바꾸고 focusChangeNote를 채우세요.
그리고 workingHypotheses를 다시 작성하세요. 이번 발언에서 드러난 주제에 대한 가설을 첫 번째로 넣고, 이번 발언으로 사실이 확인된 가설은 목록에서 빼세요.
confirmedFacts는 기존 ${state.confirmedFacts.length}개 항목을 그대로 유지한 채, 이번 발언에서 직원이 직접 말한 내용을 추가해서 전체 목록으로 반환하세요.`
    : `[리더의 요청]\n${quickAction}\n\n이 요청에 맞춰 현재 대화 맥락을 기반으로 다시 제안하세요.`;

  try {
    const update = await requestJsonCompletion<LiveUpdate>(
      SYSTEM_PROMPT,
      `${formatConversationState(state)}\n\n${trigger}`,
    );
    return NextResponse.json(update);
  } catch (error) {
    if (error instanceof OpenAiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
