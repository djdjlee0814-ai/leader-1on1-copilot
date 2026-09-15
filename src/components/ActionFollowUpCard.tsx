"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/QuickStartForm";
import {
  EVALUATION_GRADES,
  GRADE_DESCRIPTIONS,
  type ActionDraft,
  type CloseSummary,
  type EvaluationGrade,
  type MeetingContext,
  type SessionRecord,
} from "@/lib/types";

type Props = {
  draft: ActionDraft;
  context: MeetingContext;
  // 실시간 도움 모드를 거쳐 면담을 마친 경우에만 들어온다.
  closeSummary?: CloseSummary | null;
  onSave: (record: SessionRecord) => void;
};

const toText = (items: string[] | undefined) => (items ?? []).join("\n");
const toList = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function ActionFollowUpCard({
  draft,
  context,
  closeSummary,
  onSave,
}: Props) {
  const isPerformance = context.track === "performance";
  const source = closeSummary ?? draft;

  const [employeeActions, setEmployeeActions] = useState(toText(source.employeeActions));
  const [leaderActions, setLeaderActions] = useState(
    toText(closeSummary ? closeSummary.managerActions : draft.leaderActions),
  );
  const [followUpTiming, setFollowUpTiming] = useState(source.followUpTiming ?? "");
  const [metrics, setMetrics] = useState(toText(source.metrics));
  const [unresolved, setUnresolved] = useState(toText(closeSummary?.unresolved));
  const [grade, setGrade] = useState<EvaluationGrade | "">("");
  const [gradeReason, setGradeReason] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({
      id: crypto.randomUUID(),
      track: context.track,
      memberName: context.memberName,
      role: context.role,
      closedAt: new Date().toISOString().slice(0, 10),
      employeeActions: toList(employeeActions),
      managerActions: toList(leaderActions),
      followUpTiming,
      metrics: toList(metrics),
      unresolved: toList(unresolved),
      goals: context.goals,
      topics: context.topics,
      grade: isPerformance ? grade : "",
      gradeReason: isPerformance ? gradeReason : "",
      developmentPlan: closeSummary?.developmentPlan ?? null,
    });
    setSaved(true);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white px-5 py-5 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Action &amp; Follow-up
      </h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {closeSummary
          ? "면담 내용을 정리했습니다. 확인하고 수정한 뒤 저장하세요."
          : "면담에서 합의될 만한 내용을 미리 적어 두었습니다. 면담 후 실제 합의로 고쳐 저장하세요."}
      </p>

      {closeSummary?.discussionSummary && (
        <p className="mt-3 rounded-md bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {closeSummary.discussionSummary}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <label className={labelClass}>직원이 하기로 한 것 (한 줄에 하나)</label>
          <textarea
            value={employeeActions}
            onChange={(event) => setEmployeeActions(event.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>리더가 지원하기로 한 것 (한 줄에 하나)</label>
          <textarea
            value={leaderActions}
            onChange={(event) => setLeaderActions(event.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Follow-up 시점</label>
            <input
              type="text"
              value={followUpTiming}
              onChange={(event) => setFollowUpTiming(event.target.value)}
              placeholder="예: 3주 뒤 1:1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>확인할 지표/변화 (한 줄에 하나)</label>
            <textarea
              value={metrics}
              onChange={(event) => setMetrics(event.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
        </div>

        {closeSummary && (
          <div>
            <label className={labelClass}>아직 확인이 필요한 것 (한 줄에 하나)</label>
            <textarea
              value={unresolved}
              onChange={(event) => setUnresolved(event.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>
        )}

        {isPerformance && (
          <div className="rounded-lg border border-zinc-200 px-4 py-4 dark:border-zinc-800">
            <span className={labelClass}>평가등급 (선택)</span>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              AI는 등급을 제안하지 않습니다. 면담 결과를 바탕으로 리더가 직접 결정합니다.
            </p>

            {closeSummary?.gradeBasis && closeSummary.gradeBasis.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                {closeSummary.gradeBasis.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}

            <div className="mt-3 grid grid-cols-5 gap-2">
              {EVALUATION_GRADES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGrade(grade === option ? "" : option)}
                  className={`rounded-md border px-2 py-2.5 text-center text-base font-semibold transition-colors ${
                    grade === option
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {grade
                ? `${grade} · ${GRADE_DESCRIPTIONS[grade]}`
                : "S(기대를 크게 뛰어넘음) ~ D(기대에 크게 미치지 못함)"}
            </p>

            {grade && (
              <div className="mt-3">
                <label className={labelClass}>등급 결정 사유</label>
                <textarea
                  value={gradeReason}
                  onChange={(event) => setGradeReason(event.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          면담 기록 저장
        </button>
        {saved && (
          <span className="text-sm text-emerald-700 dark:text-emerald-400">
            저장했습니다. 다음 면담에서 이 팀원을 선택하면 불러올 수 있어요.
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        저장을 누른 경우에만 이 브라우저에 보관됩니다. 서버에는 저장되지 않습니다.
      </p>
    </section>
  );
}
