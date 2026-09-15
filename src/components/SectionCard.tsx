"use client";

import { useState, type ReactNode } from "react";

type Props = {
  step: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

// 결과 화면의 카드 UI — 긴 내용을 한꺼번에 보여주지 않도록 접기/펼치기를 제공한다.
export default function SectionCard({
  step,
  title,
  description,
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
            {step}
          </span>
          <span>
            <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </span>
            {description && (
              <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                {description}
              </span>
            )}
          </span>
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {open ? "접기" : "펼치기"}
        </span>
      </button>
      {open && <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">{children}</div>}
    </section>
  );
}
