"use client";

import { useState } from "react";
import { btnPrimary, field, helper, label, selectable } from "@/lib/ui";
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
    <section className="border-t border-line pt-10">
      <h2 className="text-[17px] font-semibold tracking-tight text-ink">
        Action &amp; Follow-up
      </h2>
      <p className={helper}>
        {closeSummary
          ? "면담 내용을 정리했습니다. 확인하고 수정한 뒤 저장하세요."
          : "면담에서 합의될 만한 내용을 미리 적어 두었습니다. 면담 후 실제 합의로 고쳐 저장하세요."}
      </p>

      {closeSummary?.discussionSummary && (
        <p className="mt-6 border-l-2 border-line pl-5 text-[14px] leading-relaxed text-ink-muted">
          {closeSummary.discussionSummary}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-6">
        <div>
          <label className={label}>직원이 하기로 한 것</label>
          <p className={helper}>한 줄에 하나씩</p>
          <textarea
            value={employeeActions}
            onChange={(event) => setEmployeeActions(event.target.value)}
            rows={3}
            className={field}
          />
        </div>
        <div>
          <label className={label}>리더가 지원하기로 한 것</label>
          <p className={helper}>한 줄에 하나씩</p>
          <textarea
            value={leaderActions}
            onChange={(event) => setLeaderActions(event.target.value)}
            rows={3}
            className={field}
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className={label}>Follow-up 시점</label>
            <input
              type="text"
              value={followUpTiming}
              onChange={(event) => setFollowUpTiming(event.target.value)}
              placeholder="예: 3주 뒤 1:1"
              className={field}
            />
          </div>
          <div>
            <label className={label}>확인할 지표/변화</label>
            <textarea
              value={metrics}
              onChange={(event) => setMetrics(event.target.value)}
              rows={2}
              className={field}
            />
          </div>
        </div>

        {closeSummary && (
          <div>
            <label className={label}>아직 확인이 필요한 것</label>
            <textarea
              value={unresolved}
              onChange={(event) => setUnresolved(event.target.value)}
              rows={2}
              className={field}
            />
          </div>
        )}

        {isPerformance && (
          <div className="border-t border-line pt-6">
            <p className={label}>평가등급</p>
            <p className={helper}>
              AI는 등급을 제안하지 않습니다. 면담 결과를 바탕으로 리더가 직접 결정합니다.
            </p>

            {closeSummary?.gradeBasis && closeSummary.gradeBasis.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-l border-line pl-4 text-[13px] leading-relaxed text-ink-muted">
                {closeSummary.gradeBasis.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}

            <div className="mt-4 grid max-w-md grid-cols-5 gap-2">
              {EVALUATION_GRADES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGrade(grade === option ? "" : option)}
                  className={`rounded-lg border py-2.5 text-center text-[15px] font-medium transition-colors ${selectable(grade === option)}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-ink-faint">
              {grade
                ? `${grade} · ${GRADE_DESCRIPTIONS[grade]}`
                : "S(기대를 크게 뛰어넘음) ~ D(기대에 크게 미치지 못함)"}
            </p>

            {grade && (
              <div className="mt-4">
                <label className={label}>등급 결정 사유</label>
                <textarea
                  value={gradeReason}
                  onChange={(event) => setGradeReason(event.target.value)}
                  rows={2}
                  className={field}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button type="button" onClick={handleSave} className={btnPrimary}>
          면담 기록 저장
        </button>
        {saved && (
          <span className="text-[13px] text-positive">
            저장했습니다. 다음 면담에서 이 팀원을 선택하면 불러올 수 있어요.
          </span>
        )}
      </div>

      <p className="mt-4 text-[12.5px] text-ink-faint">
        저장을 누른 경우에만 보관됩니다.
      </p>
    </section>
  );
}
