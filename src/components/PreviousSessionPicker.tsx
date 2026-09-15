"use client";

import { TRACK_LABELS, type SessionRecord } from "@/lib/types";

type Props = {
  sessions: SessionRecord[];
  selectedId: string | null;
  onSelect: (record: SessionRecord | null) => void;
};

// 선택한 팀원의 지난 면담만 간략히 보여주고, 주요 합의와 미해결 항목을 이번 면담 맥락으로 가져온다.
export default function PreviousSessionPicker({
  sessions,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">지난 면담</p>

      <ul className="mt-2 flex flex-col gap-2">
        {sessions.slice(0, 3).map((record) => {
          const selected = selectedId === record.id;
          const agreements = [...record.employeeActions, ...record.managerActions];

          return (
            <li
              key={record.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md bg-white px-3 py-2.5 dark:bg-zinc-950"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-900 dark:text-zinc-100">
                  {record.closedAt.slice(5).replace("-", "/")} · {TRACK_LABELS[record.track]}
                  {record.grade && (
                    <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                      {record.grade}
                    </span>
                  )}
                </p>
                {agreements.length > 0 && (
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    주요 합의: {agreements.slice(0, 2).join(" / ")}
                  </p>
                )}
                {(record.followUpTiming || record.dueDate) && (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                    Follow-up: {record.followUpTiming || record.dueDate}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelect(selected ? null : record)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {selected ? "반영됨" : "이번 면담에 반영"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
