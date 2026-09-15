"use client";

import { useState, type FormEvent } from "react";
import PerformanceInput from "@/components/PerformanceInput";
import PreviousSessionPicker from "@/components/PreviousSessionPicker";
import {
  DURATION_OPTIONS,
  GROWTH_TOPICS,
  INTERVIEW_TRACKS,
  OPTIONAL_FIELDS,
  TRACK_DESCRIPTIONS,
  TRACK_LABELS,
  type Duration,
  type InterviewTrack,
  type MeetingContext,
  type PerformanceGoal,
  type SessionRecord,
} from "@/lib/types";

type Props = {
  loading: boolean;
  sessions: SessionRecord[];
  defaultLeaderName: string;
  onSubmit: (context: MeetingContext) => void;
};

export const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
export const labelClass = "block text-sm font-medium text-zinc-800 dark:text-zinc-200";

const EMPTY_GOAL: PerformanceGoal = { objective: "", target: "", result: "" };

export default function QuickStartForm({
  loading,
  sessions,
  defaultLeaderName,
  onSubmit,
}: Props) {
  const [track, setTrack] = useState<InterviewTrack>("performance");
  const [memberName, setMemberName] = useState("");
  const [role, setRole] = useState("");
  const [recentIssue, setRecentIssue] = useState("");
  const [duration, setDuration] = useState<Duration>("30");

  const [goals, setGoals] = useState<PerformanceGoal[]>([{ ...EMPTY_GOAL }]);
  const [performanceNotes, setPerformanceNotes] = useState("");
  const [topics, setTopics] = useState<string[]>([]);

  const [leaderName, setLeaderName] = useState(defaultLeaderName);
  const [optionalContext, setOptionalContext] = useState<Record<string, string>>({});
  const [showOptional, setShowOptional] = useState(false);
  const [previousSession, setPreviousSession] = useState<SessionRecord | null>(null);

  const optionalFields = OPTIONAL_FIELDS[track];
  const filledOptional = optionalFields.filter(
    (field) => optionalContext[field.key]?.trim(),
  ).length;

  // 이름을 입력하면 그 팀원의 지난 면담만 보여준다.
  const memberSessions = memberName.trim()
    ? sessions.filter((item) => item.memberName === memberName.trim())
    : [];
  const knownMembers = [...new Set(sessions.map((item) => item.memberName))];

  const canSubmit = Boolean(
    memberName.trim() && role.trim() && recentIssue.trim() && !loading,
  );

  function selectMember(name: string) {
    setMemberName(name);
    const latest = sessions.find((item) => item.memberName === name);
    if (latest && !role.trim()) setRole(latest.role);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      track,
      leaderName,
      memberName: memberName.trim(),
      role: role.trim(),
      recentIssue: recentIssue.trim(),
      duration,
      goals: track === "performance" ? goals.filter((goal) => goal.objective.trim()) : [],
      performanceNotes: track === "performance" ? performanceNotes.trim() : "",
      topics: track === "development" ? topics : [],
      optionalContext,
      previousSession: previousSession ?? undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <span className={labelClass}>어떤 면담인가요?</span>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {INTERVIEW_TRACKS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setTrack(option);
                setOptionalContext({});
                setShowOptional(false);
              }}
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                track === option
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="block text-sm font-semibold">{TRACK_LABELS[option]}</span>
              <span
                className={`mt-1 block text-xs leading-relaxed ${
                  track === option
                    ? "text-zinc-300 dark:text-zinc-600"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {TRACK_DESCRIPTIONS[option]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>팀원 이름</label>
          <input
            type="text"
            value={memberName}
            onChange={(event) => setMemberName(event.target.value)}
            placeholder="예: K매니저"
            className={inputClass}
          />
          {knownMembers.length > 0 && !memberName.trim() && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {knownMembers.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => selectMember(name)}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>팀원 직무/역할</label>
          <input
            type="text"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="예: 채용담당 매니저"
            className={inputClass}
          />
        </div>
      </div>

      {memberSessions.length > 0 && (
        <PreviousSessionPicker
          sessions={memberSessions}
          selectedId={previousSession?.id ?? null}
          onSelect={setPreviousSession}
        />
      )}

      <div>
        <label className={labelClass}>최근 상황 또는 이번에 다루고 싶은 이슈</label>
        <textarea
          value={recentIssue}
          onChange={(event) => setRecentIssue(event.target.value)}
          rows={3}
          placeholder="예: 채용 브랜딩 업무가 새로 추가되고 신규 채용도 늘면서 기존 채용 건의 진행이 늦어지고 있음"
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>면담 예정 시간</span>
        <div className="mt-2 flex gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDuration(option)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                duration === option
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              {option}분
            </button>
          ))}
        </div>
      </div>

      {track === "performance" && (
        <PerformanceInput
          goals={goals}
          notes={performanceNotes}
          onGoalsChange={setGoals}
          onNotesChange={setPerformanceNotes}
        />
      )}

      {track === "development" && (
        <div>
          <span className={labelClass}>이번 대화에서 특히 다루고 싶은 주제</span>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            고르지 않아도 진행할 수 있어요. 여러 개 선택해도 됩니다.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GROWTH_TOPICS.map((topic) => {
              const selected = topics.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() =>
                    setTopics((prev) =>
                      selected ? prev.filter((item) => item !== topic) : [...prev, topic],
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setShowOptional((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
              조금 더 알려주기
              {filledOptional > 0 && (
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {filledOptional}개 입력됨
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
              비워두어도 됩니다. 채울수록 질문이 더 구체적으로 만들어집니다.
            </span>
          </span>
          <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
            {showOptional ? "접기" : "펼치기"}
          </span>
        </button>

        {showOptional && (
          <div className="flex flex-col gap-4 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
            <div>
              <label className={labelClass}>리더 이름</label>
              <input
                type="text"
                value={leaderName}
                onChange={(event) => setLeaderName(event.target.value)}
                placeholder="한 번 입력하면 다음부터 자동으로 채워집니다"
                className={inputClass}
              />
            </div>

            {optionalFields.map((field) => (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    value={optionalContext[field.key] ?? ""}
                    onChange={(event) =>
                      setOptionalContext((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="text"
                    value={optionalContext[field.key] ?? ""}
                    onChange={(event) =>
                      setOptionalContext((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-full bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loading ? "면담 가이드를 만드는 중..." : "면담 준비하기"}
      </button>
    </form>
  );
}
