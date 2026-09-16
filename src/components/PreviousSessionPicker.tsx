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
    <section className="border-l-2 border-line pl-5">
      <p className="eyebrow">지난 면담</p>

      <ul className="mt-3 flex flex-col divide-y divide-line">
        {sessions.slice(0, 3).map((record) => {
          const selected = selectedId === record.id;
          const agreements = [...record.employeeActions, ...record.managerActions];

          return (
            <li
              key={record.id}
              className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink">
                  {record.closedAt.slice(5).replace("-", "/")} ·{" "}
                  {TRACK_LABELS[record.track]}
                  {record.grade && (
                    <span className="ml-2 text-ink-faint">등급 {record.grade}</span>
                  )}
                </p>
                {agreements.length > 0 && (
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                    {agreements.slice(0, 2).join(" · ")}
                  </p>
                )}
                {(record.followUpTiming || record.dueDate) && (
                  <p className="mt-0.5 text-[12.5px] text-ink-faint">
                    Follow-up {record.followUpTiming || record.dueDate}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelect(selected ? null : record)}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors ${
                  selected
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {selected ? "반영됨" : "이번 면담에 반영"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
