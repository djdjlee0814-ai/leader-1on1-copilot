"use client";

import { useState } from "react";
import { inputClass, labelClass } from "@/components/QuickStartForm";
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
    <div className="rounded-lg border border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={labelClass}>성과 정보 (선택)</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              mode === "paste"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            자료 붙여넣기
          </button>
          <button
            type="button"
            onClick={() => setMode("simple")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              mode === "simple"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            }`}
          >
            간단 입력
          </button>
        </div>
      </div>

      {mode === "paste" ? (
        <div className="mt-3">
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={6}
            placeholder={`목표/KPI, 평가결과, Self-review, 평가 코멘트 등이 있다면 그대로 붙여 넣어 주세요. AI가 면담에 필요한 내용을 정리합니다.

예)
채용 Lead Time 목표 35일 / 실제 52일
핵심직무 채용 8건 중 6건 완료
신규 채용 Branding 업무 추가
상반기 평가 B`}
            className={inputClass}
          />
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {goals.map((goal, index) => (
            <div
              key={index}
              className="rounded-md border border-zinc-100 px-3 py-3 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  목표 {index + 1}
                </span>
                {goals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onGoalsChange(goals.filter((_, i) => i !== index))}
                    className="text-xs text-zinc-500 underline dark:text-zinc-400"
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
                className={inputClass}
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
                  className={inputClass}
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
                  className={inputClass}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onGoalsChange([...goals, { ...EMPTY_GOAL }])}
            className="self-start rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            목표 추가
          </button>
        </div>
      )}
    </div>
  );
}
