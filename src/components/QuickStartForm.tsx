"use client";

import { useState, type FormEvent } from "react";
import PerformanceInput from "@/components/PerformanceInput";
import PreviousSessionPicker from "@/components/PreviousSessionPicker";
import { btnPrimary, btnQuiet, field, helper, label, selectable } from "@/lib/ui";
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
    (item) => optionalContext[item.key]?.trim(),
  ).length;

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">
      <section>
        <p className="eyebrow">면담 유형</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {INTERVIEW_TRACKS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setTrack(option);
                setOptionalContext({});
                setShowOptional(false);
              }}
              className={`rounded-xl border px-5 py-4 text-left transition-colors ${selectable(track === option)}`}
            >
              <span className="block text-[14px] font-medium text-ink">
                {TRACK_LABELS[option]}
              </span>
              <span className="mt-1.5 block text-[12.5px] leading-relaxed text-ink-muted">
                {TRACK_DESCRIPTIONS[option]}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label}>팀원 이름</label>
            <input
              type="text"
              value={memberName}
              onChange={(event) => setMemberName(event.target.value)}
              placeholder="예: K매니저"
              className={field}
            />
            {knownMembers.length > 0 && !memberName.trim() && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {knownMembers.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectMember(name)}
                    className="rounded-md border border-line px-2.5 py-1 text-[12px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={label}>팀원 직무/역할</label>
            <input
              type="text"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="예: 채용담당 매니저"
              className={field}
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
          <label className={label}>최근 상황 또는 이번에 다루고 싶은 이슈</label>
          <textarea
            value={recentIssue}
            onChange={(event) => setRecentIssue(event.target.value)}
            rows={3}
            placeholder="예: 채용 브랜딩 업무가 새로 추가되고 신규 채용도 늘면서 기존 채용 건의 진행이 늦어지고 있음"
            className={field}
          />
        </div>

        <div>
          <p className={label}>면담 예정 시간</p>
          <div className="mt-2 flex gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-medium tabular-nums transition-colors ${selectable(duration === option)}`}
              >
                {option}분
              </button>
            ))}
          </div>
        </div>
      </section>

      {track === "performance" && (
        <PerformanceInput
          goals={goals}
          notes={performanceNotes}
          onGoalsChange={setGoals}
          onNotesChange={setPerformanceNotes}
        />
      )}

      {track === "development" && (
        <section>
          <p className={label}>이번 대화에서 특히 다루고 싶은 주제</p>
          <p className={helper}>
            고르지 않아도 진행할 수 있어요. 여러 개 선택해도 됩니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
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
                  className={`rounded-lg border px-3 py-2 text-[13px] transition-colors ${selectable(selected)}`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="border-t border-line pt-6">
        <button
          type="button"
          onClick={() => setShowOptional((prev) => !prev)}
          className="flex w-full items-baseline justify-between gap-4 text-left"
        >
          <span>
            <span className="text-[13px] font-medium text-ink">
              조금 더 알려주기
              {filledOptional > 0 && (
                <span className="ml-2 text-[12px] font-normal text-ink-faint">
                  {filledOptional}개 입력됨
                </span>
              )}
            </span>
            <span className="mt-1 block text-[12.5px] text-ink-faint">
              비워두어도 됩니다. 채울수록 질문이 더 구체적으로 만들어집니다.
            </span>
          </span>
          <span className={btnQuiet}>{showOptional ? "접기" : "펼치기"}</span>
        </button>

        {showOptional && (
          <div className="mt-6 flex flex-col gap-6">
            <div>
              <label className={label}>리더 이름</label>
              <input
                type="text"
                value={leaderName}
                onChange={(event) => setLeaderName(event.target.value)}
                placeholder="한 번 입력하면 다음부터 자동으로 채워집니다"
                className={field}
              />
            </div>

            {optionalFields.map((item) => (
              <div key={item.key}>
                <label className={label}>{item.label}</label>
                {item.multiline ? (
                  <textarea
                    value={optionalContext[item.key] ?? ""}
                    onChange={(event) =>
                      setOptionalContext((prev) => ({
                        ...prev,
                        [item.key]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder={item.placeholder}
                    className={field}
                  />
                ) : (
                  <input
                    type="text"
                    value={optionalContext[item.key] ?? ""}
                    onChange={(event) =>
                      setOptionalContext((prev) => ({
                        ...prev,
                        [item.key]: event.target.value,
                      }))
                    }
                    placeholder={item.placeholder}
                    className={field}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div>
        <button type="submit" disabled={!canSubmit} className={btnPrimary}>
          {loading ? "면담 가이드를 만드는 중..." : "면담 준비하기"}
        </button>
      </div>
    </form>
  );
}
