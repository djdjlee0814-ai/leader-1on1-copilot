import { HR_SAFETY_RULES } from "@/lib/openai";
import { OPTIONAL_FIELDS, TRACK_LABELS } from "@/lib/types";
import type { ConversationState, MeetingContext } from "@/lib/types";

// 모든 프롬프트가 공유하는 원칙 — 사람을 규정하지 않고 지금 대화에 나타난 행동만 해석한다.
export const COPILOT_PRINCIPLES = `[코파일럿 기본 원칙]
- 이 도구는 질문을 많이 만들어 내는 도구가 아니다. 리더가 더 잘 듣고, 더 정확히 피드백하고, 명확한 행동을 합의하도록 돕는 도구다.
- 직원의 태도, 성격, 능력, 동기를 근거 없이 단정하지 않는다. 리더가 입력한 내용은 한쪽에서 본 관찰이며, 직원의 설명은 아직 듣지 않았다.
- "OO님은 방어적인 사람입니다", "의욕이 떨어졌습니다" 같은 사람에 대한 규정을 쓰지 않는다. 지금 확인된 행동과 상황만 다룬다.
- 사실과 판단을 구분한다. 리더가 알려준 것과 확인이 필요한 것을 섞지 않는다.
- 질문은 열린 질문으로 만든다. 답을 정해놓고 유도하는 질문, 직원을 방어적으로 만드는 질문을 만들지 않는다.
- 방법론 이름(GROW, SBI, Feedforward 등)을 화면에 드러내지 않는다. 리더는 이론을 배우러 온 것이 아니라 좋은 면담을 하러 왔다.
- 면담은 반드시 다음 행동 합의로 끝난다.

[면담 유형별 흐름]
- 성과면담: 직원의 관점 확인 → 사실·성과 확인 → Gap 원인 탐색 → 통제 가능한 영역 → 기대수준 → Action
  · 결과가 기대에 못 미쳐도 원인을 먼저 단정하지 않는다. 직원이 인식하는 원인을 먼저 듣는 질문으로 시작한다.
  · 잘된 부분이 있으면 반드시 함께 다룬다. 지적만 하는 자리로 만들지 않는다.
  · 환경적 요인과 직원이 통제할 수 있었던 영역을 구분해서 다룬다.
- 성장·육성면담: 직원의 현재 인식 → 강점 → 관심·동기 → 성장 영역 → 경험·기회 → 지원 → Action
  · 이 면담은 문제가 있는 직원을 위한 자리가 아니다. 문제 진단처럼 들리는 표현을 쓰지 않는다.
  · 리더가 고른 주제가 있으면 그 주제를 중심으로 구성한다.
  · 주제에 "아직 잘 모르겠음"이 있으면, 무엇을 다룰지 직원과 함께 찾는 탐색형 대화로 구성한다.

${HR_SAFETY_RULES}`;

export function formatMeetingContext(context: MeetingContext) {
  const lines = [
    `- 면담 유형: ${TRACK_LABELS[context.track]}`,
    `- 팀원: ${context.memberName}`,
    `- 팀원 직무/역할: ${context.role}`,
    `- 최근 상황 또는 이번에 다루고 싶은 이슈: ${context.recentIssue}`,
    `- 면담 예정 시간: ${context.duration}분`,
  ];

  if (context.leaderName?.trim()) {
    lines.push(`- 리더 이름: ${context.leaderName.trim()}`);
  }

  const goals = context.goals?.filter((goal) => goal.objective.trim()) ?? [];
  if (goals.length) {
    lines.push("- 목표와 결과:");
    goals.forEach((goal, index) => {
      lines.push(
        `  ${index + 1}) 목표: ${goal.objective} / 기대수준: ${goal.target || "미기재"} / 실제 성과: ${goal.result || "미기재"}`,
      );
    });
  }

  if (context.performanceNotes?.trim()) {
    lines.push(
      "- 리더가 붙여넣은 성과 자료 (정리되지 않은 원문이므로 당신이 직접 해석할 것):",
      context.performanceNotes
        .trim()
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n"),
    );
  }

  if (context.topics?.length) {
    lines.push(`- 이번에 다루고 싶은 주제: ${context.topics.join(", ")}`);
  }

  const fields = OPTIONAL_FIELDS[context.track] ?? [];
  for (const field of fields) {
    const value = context.optionalContext?.[field.key];
    if (value?.trim()) {
      lines.push(`- ${field.label}: ${value.trim()}`);
    }
  }

  const previous = context.previousSession;
  if (previous) {
    lines.push(
      `- [지난 면담(${previous.closedAt}, ${TRACK_LABELS[previous.track]})에서 합의한 내용]`,
      `  · 직원 실행 항목: ${previous.employeeActions.join(" / ") || "없음"}`,
      `  · 리더 지원 항목: ${previous.managerActions.join(" / ") || "없음"}`,
      `  · Follow-up 시점: ${previous.followUpTiming || previous.dueDate || "미정"}`,
      `  · 미해결 항목: ${previous.unresolved.join(" / ") || "없음"}`,
    );
    if (previous.grade) {
      lines.push(
        `  · 지난 성과평가 등급: ${previous.grade}${previous.gradeReason ? ` (${previous.gradeReason})` : ""}`,
      );
    }
    lines.push(
      "  · 이번 면담 도입부에서 위 합의 사항의 진행 상황을 먼저 확인하도록 구성할 것.",
    );
  }

  return lines.join("\n");
}

export function formatConversationState(state: ConversationState) {
  const history = state.conversationHistory.length
    ? state.conversationHistory
        .map((turn) => `  · ${turn.speaker === "employee" ? "직원" : "리더"}: ${turn.text}`)
        .join("\n")
    : "  · (아직 기록된 발언 없음)";

  return `[면담 배경]
${formatMeetingContext(state.meetingContext)}

[지금까지 확인된 사실]
${state.confirmedFacts.map((item) => `  · ${item}`).join("\n") || "  · (없음)"}

[확인이 필요한 가설]
${state.workingHypotheses.map((item) => `  · ${item}`).join("\n") || "  · (없음)"}

[직원이 드러낸 우려]
${state.employeeConcerns.map((item) => `  · ${item}`).join("\n") || "  · (없음)"}

[대화 기록]
${history}

[현재 대화 초점] ${state.currentFocus || "(미정)"}
[현재 단계] ${state.currentStage || "(미정)"}
[직전 추천 행동] ${state.recommendedMove?.move ?? "(없음)"}
[직전 추천 질문] ${state.suggestedQuestion || "(없음)"}

[정리 중인 실행 후보]
${state.potentialActions.map((item) => `  · ${item}`).join("\n") || "  · (없음)"}

[아직 해소되지 않은 질문]
${state.unresolvedQuestions.map((item) => `  · ${item}`).join("\n") || "  · (없음)"}`;
}
