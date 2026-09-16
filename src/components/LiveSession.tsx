"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { btnPrimary, btnQuiet, btnSecondary, field, label } from "@/lib/ui";
import {
  MOVE_LABELS,
  QUICK_ACTIONS,
  TRACK_LABELS,
  type ConversationState,
  type LiveUpdate,
  type QuickAction,
} from "@/lib/types";

type Props = {
  state: ConversationState;
  onStateChange: (state: ConversationState) => void;
  onClose: () => void;
  closing: boolean;
};

function useElapsedMinutes() {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 60000));
    }, 10000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return elapsed;
}

export default function LiveSession({ state, onStateChange, onClose, closing }: Props) {
  const router = useRouter();
  const [utterance, setUtterance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showContext, setShowContext] = useState(false);
  const elapsed = useElapsedMinutes();
  const planned = Number(state.meetingContext.duration);

  async function sendUpdate(payload: { utterance?: string; quickAction?: QuickAction }) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, ...payload }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }

      const update = data as LiveUpdate;
      onStateChange({
        ...state,
        ...update,
        conversationHistory: payload.utterance
          ? [
              ...state.conversationHistory,
              {
                speaker: "employee",
                text: payload.utterance,
                at: new Date().toISOString(),
              },
            ]
          : state.conversationHistory,
      });
      setUtterance("");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          {state.meetingContext.memberName}
          <span className="ml-3 text-[14px] font-normal text-ink-faint">
            {TRACK_LABELS[state.meetingContext.track]}
          </span>
        </h1>
        <span className="text-[13px] tabular-nums text-ink-faint">
          {elapsed}분 / {planned}분
        </span>
      </div>

      {state.focusChangeNote && (
        <p className="mt-8 border-l-2 border-caution pl-5 text-[13px] leading-relaxed text-ink-muted">
          <span className="eyebrow block" style={{ color: "var(--caution)" }}>
            대화 방향 변경
          </span>
          <span className="mt-1.5 block">{state.focusChangeNote}</span>
        </p>
      )}

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <p className="eyebrow">지금 확인 중</p>
          {state.currentStage && (
            <p className="text-[12.5px] text-ink-faint">{state.currentStage}</p>
          )}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{state.currentFocus}</p>
      </section>

      <section className="mt-8 border-l-2 border-accent pl-5">
        <p className="eyebrow">
          {state.recommendedMove.move}
          <span className="ml-2 normal-case tracking-normal text-ink-faint">
            {MOVE_LABELS[state.recommendedMove.move] ?? ""}
          </span>
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          {state.recommendedMove.reason}
        </p>
      </section>

      {state.suggestedStatement && (
        <section className="mt-8 border-l-2 border-positive pl-5">
          <p className="eyebrow" style={{ color: "var(--positive)" }}>
            리더가 전달할 문장
          </p>
          <p className="mt-2 text-[16px] leading-[1.7] text-ink">
            {state.suggestedStatement}
          </p>
        </section>
      )}

      <section className="mt-10">
        <p className="eyebrow">다음 질문</p>
        <p className="mt-3 text-[20px] font-medium leading-[1.6] tracking-tight text-ink">
          {state.suggestedQuestion}
        </p>

        {state.alternativeQuestions.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2 border-l border-line pl-4">
            {state.alternativeQuestions.slice(0, 2).map((question, index) => (
              <li key={index} className="text-[14px] leading-relaxed text-ink-muted">
                {question}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            disabled={loading}
            onClick={() => sendUpdate({ quickAction: action })}
            className="rounded-lg border border-line px-3 py-2 text-[12.5px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-35"
          >
            {action}
          </button>
        ))}
      </div>

      <section className="mt-10 border-t border-line pt-8">
        <label className={label}>직원 발언 입력</label>
        <textarea
          value={utterance}
          onChange={(event) => setUtterance(event.target.value)}
          rows={2}
          placeholder="직원의 주요 답변이나 새롭게 확인된 내용을 짧게 입력하세요."
          className={field}
        />
        <button
          type="button"
          disabled={loading || !utterance.trim()}
          onClick={() => sendUpdate({ utterance: utterance.trim() })}
          className={`mt-4 ${btnPrimary}`}
        >
          {loading ? "대화 방향을 다시 잡는 중..." : "발언 추가"}
        </button>
      </section>

      {error && (
        <p className="mt-6 border-l-2 border-negative bg-negative-soft px-4 py-3 text-[13px] text-negative">
          {error}
        </p>
      )}

      <section className="mt-10 border-t border-line pt-6">
        <button
          type="button"
          onClick={() => setShowContext((prev) => !prev)}
          className="flex w-full items-baseline justify-between gap-4 text-left"
        >
          <span className="text-[13px] text-ink-muted">
            확인된 사실 {state.confirmedFacts.length} · 가설{" "}
            {state.workingHypotheses.length} · 발언 {state.conversationHistory.length}
          </span>
          <span className={btnQuiet}>{showContext ? "접기" : "펼치기"}</span>
        </button>

        {showContext && (
          <div className="mt-6 flex flex-col gap-6">
            <div>
              <p className="eyebrow">확인된 사실</p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                {state.confirmedFacts.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">확인이 필요한 가설</p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                {state.workingHypotheses.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            {state.potentialActions.length > 0 && (
              <div>
                <p className="eyebrow">실행 후보</p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                  {state.potentialActions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {state.conversationHistory.length > 0 && (
              <div>
                <p className="eyebrow">대화 기록</p>
                <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                  {state.conversationHistory.map((turn, index) => (
                    <li key={index}>{turn.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mt-10">
        <button
          type="button"
          onClick={onClose}
          disabled={closing}
          className={btnSecondary}
        >
          {closing ? "면담 내용을 정리하는 중..." : "면담 종료"}
        </button>
      </div>
    </div>
  );
}
