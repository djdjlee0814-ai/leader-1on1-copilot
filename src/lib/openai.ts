// OpenAI 호출 공통 모듈 — API 키는 서버(.env)에서만 읽어 사용하며 화면으로 전달되지 않는다.

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 90_000;

export class OpenAiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function requestJsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAiError("서버에 OPENAI_API_KEY가 설정되어 있지 않습니다.", 500);
  }

  // 외부 API가 응답하지 않을 때 요청이 무한정 대기하지 않도록 제한
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("OpenAI API 오류:", await response.text());
      throw new OpenAiError(
        "AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new OpenAiError(
        "AI 응답이 비어 있습니다. 잠시 후 다시 시도해주세요.",
        502,
      );
    }

    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof OpenAiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenAiError(
        "AI 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
        504,
      );
    }
    console.error("AI 요청 처리 중 오류:", error);
    throw new OpenAiError("잠시 후 다시 시도해주세요.", 500);
  } finally {
    clearTimeout(timer);
  }
}

// 모든 생성 요청에 공통으로 적용되는 HR 안전 규칙 (PRD 8번 요구사항)
export const HR_SAFETY_RULES = `[HR 안전 규칙 — 반드시 준수]
- 건강 상태나 질병을 탐문하는 질문을 만들지 않는다.
- 결혼, 출산, 가족 계획에 관한 질문을 만들지 않는다.
- 종교나 정치 성향에 관한 질문을 만들지 않는다.
- 업무와 직접 관련 없는 사생활을 탐문하지 않는다.
- 팀원의 성격 유형이나 정신 상태를 임의로 진단하거나 분류하지 않는다. MBTI 등 성격 유형 분류를 언급하지 않는다.
- 팀원이 개인적인 사정을 자발적으로 말하는 경우, 더 캐묻지 말고 "업무 수행에 필요한 지원"을 확인하는 방향으로 대화를 돌리도록 안내한다.
- 이 대화는 코칭 면담이다. 징계, PIP(성과개선계획), 공식 성과평가 통보 절차와 혼동되는 표현을 사용하지 않는다.`;
