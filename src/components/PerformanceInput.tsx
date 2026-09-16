"use client";

import { useState } from "react";
import { field, helper, label, selectable } from "@/lib/ui";
import type { PerformanceGoal } from "@/lib/types";

type Props = {
  goals: PerformanceGoal[];
  notes: string;
  onGoalsChange: (goals: PerformanceGoal[]) => void;
  onNotesChange: (notes: string) => void;
};

type Mode = "simple" | "paste";

const EMPTY_GOAL: PerformanceGoal = { objective: "", target: "", result: "" };

// 성과 정보는 필수가 아니다. 리더가 편한 방식을 고를 수 있게 두 가지를 제공한다.
export default function PerformanceInput({
  goals,
  notes,
  onGoalsChange,
  onNotesChange,
}: Props) {
  const [mode, setMode] = useState<Mode>("paste");

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className={label}>성과 정보</p>
          <p className={helper}>선택 입력입니다. 있는 자료를 그대로 붙여 넣어도 됩니다.</p>
        </div>
        <div className="flex gap-2">
          {(["paste", "simple"] as Mode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors ${selectable(mode === option)}`}
            >
              {option === "paste" ? "자료 붙여넣기" : "간단 입력"}
            </button>
          ))}
        </div>
      </div>

      {mode === "paste" ? (
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={6}
          placeholder={`목표/KPI, 평가결과, Self-review, 평가 코멘트 등이 있다면 그대로 붙여 넣어 주세요.

예)
채용 Lead Time 목표 35일 / 실제 52일
핵심직무 채용 8건 중 6건 완료
상반기 평가 B`}
          className={`${field} mt-4`}
        />
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {goals.map((goal, index) => (
            <div key={index} className="border-l border-line pl-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] text-ink-faint">목표 {index + 1}</span>
                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onGoalsChange(goals.filter((_, i) => i !== index))}
                    className="text-[12px] text-ink-faint underline underline-offset-2 hover:text-ink-muted"
                  >
                    삭제
                  </button>
                )}
              </div>
              <input
                type="text"
                value={goal.objective}
                onChange={(event) =>
                  onGoalsChange(
                    goals.map((item, i) =>
                      i === index ? { ...item, objective: event.target.value } : item,
                    ),
                  )
                }
                placeholder="목표 (예: 채용 Lead Time 단축)"
                className={field}
              />
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                <input
                  type="text"
                  value={goal.target}
                  onChange={(event) =>
                    onGoalsChange(
                      goals.map((item, i) =>
                        i === index ? { ...item, target: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="기대수준 (예: 평균 35일)"
                  className={`${field} mt-0`}
                />
                <input
                  type="text"
                  value={goal.result}
                  onChange={(event) =>
                    onGoalsChange(
                      goals.map((item, i) =>
                        i === index ? { ...item, result: event.target.value } : item,
                      ),
                    )
                  }
                  placeholder="실제 성과 (예: 평균 52일)"
                  className={`${field} mt-0`}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onGoalsChange([...goals, { ...EMPTY_GOAL }])}
            className="self-start rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            목표 추가
          </button>
        </div>
      )}
    </section>
  );
}
