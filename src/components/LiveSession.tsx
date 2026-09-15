"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <span>
          {state.meetingContext.memberName} · {TRACK_LABELS[state.meetingContext.track]}
        </span>
        <span>
          {elapsed}분 경과 / {planned}분
        </span>
      </div>

      {state.focusChangeNote && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span className="font-semibold">대화 방향 변경&nbsp;</span>
          {state.focusChangeNote}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Current Focus
          </p>
          {state.currentStage && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              현재 단계: {state.currentStage}
            </p>
          )}
        </div>
        <p className="mt-2 text-base font-medium text-zinc-900 dark:text-zinc-100">
          {state.currentFocus}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
            {state.recommendedMove.move}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {MOVE_LABELS[state.recommendedMove.move] ?? "추천 행동"}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {state.recommendedMove.reason}
        </p>
      </div>

      {state.suggestedStatement && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            리더가 전달할 문장
          </p>
          <p className="mt-2 text-base leading-relaxed text-emerald-900 dark:text-emerald-100">
            {state.suggestedStatement}
          </p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-900 bg-zinc-900 px-6 py-5 dark:border-zinc-100 dark:bg-zinc-100">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Suggested Next Question
        </p>
        <p className="mt-2 text-lg font-semibold leading-relaxed text-white dark:text-zinc-900">
          {state.suggestedQuestion}
        </p>

        {state.alternativeQuestions.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1.5 border-t border-zinc-700 pt-3 dark:border-zinc-300">
            {state.alternativeQuestions.slice(0, 2).map((question, index) => (
              <li key={index} className="text-sm text-zinc-300 dark:text-zinc-600">
                {question}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            disabled={loading}
            onClick={() => sendUpdate({ quickAction: action })}
            className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {action}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          직원 발언 입력
        </label>
        <textarea
          value={utterance}
          onChange={(event) => setUtterance(event.target.value)}
          rows={2}
          placeholder="직원의 주요 답변이나 새롭게 확인된 내용을 짧게 입력하세요."
          className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          disabled={loading || !utterance.trim()}
          onClick={() => sendUpdate({ utterance: utterance.trim() })}
          className="mt-3 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "대화 방향을 다시 잡는 중..." : "발언 추가"}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          onClick={() => setShowContext((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-3 text-left"
        >
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            확인된 사실 {state.confirmedFacts.length} · 가설{" "}
            {state.workingHypotheses.length} · 발언 {state.conversationHistory.length}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {showContext ? "접기" : "펼치기"}
          </span>
        </button>

        {showContext && (
          <div className="flex flex-col gap-4 border-t border-zinc-100 px-5 py-4 text-sm dark:border-zinc-800">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">확인된 사실</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
                {state.confirmedFacts.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                확인이 필요한 가설
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
                {state.workingHypotheses.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            {state.potentialActions.length > 0 && (
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">실행 후보</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
                  {state.potentialActions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {state.conversationHistory.length > 0 && (
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">대화 기록</p>
                <ul className="mt-1 flex flex-col gap-1 text-zinc-700 dark:text-zinc-300">
                  {state.conversationHistory.map((turn, index) => (
                    <li key={index}>
                      <span className="mr-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                        직원
                      </span>
                      {turn.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        disabled={closing}
        className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {closing ? "면담 내용을 정리하는 중..." : "면담 종료"}
      </button>
    </div>
  );
}
