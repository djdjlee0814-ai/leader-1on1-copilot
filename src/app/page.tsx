"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import ActionFollowUpCard from "@/components/ActionFollowUpCard";
import ConversationGuideView from "@/components/ConversationGuideView";
import LiveSession from "@/components/LiveSession";
import QuickStartForm from "@/components/QuickStartForm";
import {
  getLeaderName,
  getSessions,
  getSessionsOnServer,
  saveLeaderName,
  saveSession,
  subscribeSessions,
} from "@/lib/sessionStore";
import type {
  CloseSummary,
  ConversationGuide,
  ConversationState,
  MeetingContext,
  SessionRecord,
} from "@/lib/types";

type Phase = "quickStart" | "guide" | "live";

// 가이드의 첫 질문으로 실시간 도움 모드의 출발점을 만든다. (추가 AI 호출 없이 구성)
function buildInitialState(
  guide: ConversationGuide,
  context: MeetingContext,
): ConversationState {
  const questions = guide.phases?.flatMap((phase) => phase.questions ?? []) ?? [];
  const firstPhase = guide.phases?.[0];

  return {
    meetingContext: context,
    confirmedFacts: guide.brief?.confirmedFacts ?? [],
    workingHypotheses: guide.brief?.needsCheck ?? [],
    conversationHistory: [],
    currentFocus: firstPhase?.purpose ?? "직원의 관점 확인",
    currentStage: firstPhase?.title ?? "Opening",
    recommendedMove: {
      move: "Listen",
      reason: "먼저 직원이 상황을 어떻게 보고 있는지 듣는 단계입니다.",
    },
    employeeConcerns: [],
    managerMessages: [],
    potentialActions: guide.suggestedActions?.employeeActions ?? [],
    unresolvedQuestions: guide.brief?.needsCheck ?? [],
    suggestedQuestion: questions[0]?.question ?? "",
    alternativeQuestions: questions.slice(1, 3).map((item) => item.question),
    suggestedStatement: "",
    focusChangeNote: "",
  };
}

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("quickStart");
  const [guide, setGuide] = useState<ConversationGuide | null>(null);
  const [state, setState] = useState<ConversationState | null>(null);
  const [closeSummary, setCloseSummary] = useState<CloseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");

  const sessions = useSyncExternalStore(
    subscribeSessions,
    getSessions,
    getSessionsOnServer,
  );

  async function handleQuickStart(context: MeetingContext) {
    setLoading(true);
    setError("");
    saveLeaderName(context.leaderName);

    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
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

      const result = data as ConversationGuide;
      setGuide(result);
      setState(buildInitialState(result, context));
      setCloseSummary(null);
      setPhase("guide");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCloseLive() {
    if (!state) return;

    setClosing(true);
    setError("");

    try {
      const response = await fetch("/api/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
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

      setCloseSummary(data as CloseSummary);
      setPhase("guide");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setClosing(false);
    }
  }

  function handleReset() {
    setPhase("quickStart");
    setGuide(null);
    setState(null);
    setCloseSummary(null);
    setError("");
  }

  function handleSave(record: SessionRecord) {
    saveSession(record);
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-10 dark:bg-black sm:px-8">
      <main className="w-full max-w-2xl">
        <header>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Leader 1:1 Copilot
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            더 나은 1:1을 위한 리더의 AI 대화 파트너
          </p>
        </header>

        {error && (
          <div className="mt-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            <p>{error}</p>
            <button type="button" onClick={() => setError("")} className="mt-2 underline">
              닫기
            </button>
          </div>
        )}

        {phase === "quickStart" && (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <QuickStartForm
              loading={loading}
              sessions={sessions}
              defaultLeaderName={getLeaderName()}
              onSubmit={handleQuickStart}
            />
          </div>
        )}

        {phase === "guide" && guide && state && (
          <div className="mt-8 flex flex-col gap-5">
            <ConversationGuideView
              guide={guide}
              context={state.meetingContext}
              onStartLive={() => setPhase("live")}
              onReset={handleReset}
            />
            <ActionFollowUpCard
              key={closeSummary ? "closed" : "draft"}
              draft={guide.suggestedActions}
              context={state.meetingContext}
              closeSummary={closeSummary}
              onSave={handleSave}
            />
          </div>
        )}

        {phase === "live" && state && (
          <div className="mt-8">
            <LiveSession
              state={state}
              onStateChange={setState}
              onClose={handleCloseLive}
              closing={closing}
            />
          </div>
        )}
      </main>
    </div>
  );
}
