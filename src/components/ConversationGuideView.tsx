"use client";

import { useState } from "react";
import {
  TRACK_LABELS,
  type ConversationGuide,
  type GuideQuestion,
  type MeetingContext,
} from "@/lib/types";

type Props = {
  guide: ConversationGuide;
  context: MeetingContext;
  onStartLive: () => void;
  onReset: () => void;
};

function QuestionBlock({ item }: { item: GuideQuestion }) {
  const [open, setOpen] = useState(false);
  const hasFollowUps = item.followUps?.length > 0 || Boolean(item.avoidResponse);

  return (
    <div className="rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <p className="text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
        {item.question}
      </p>

      {item.leaderTip && (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {item.leaderTip}
        </p>
      )}

      {hasFollowUps && (
        <>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="mt-3 text-xs font-medium text-zinc-600 underline dark:text-zinc-400"
          >
            {open ? "접기" : "직원이 이렇게 답한다면?"}
          </button>

          {open && (
            <div className="mt-3 flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              {item.followUps?.map((branch, index) => (
                <div key={index}>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    “{branch.employeeResponse}”
                  </p>
                  <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    → {branch.suggestedFollowUp}
                  </p>
                </div>
              ))}

              {item.avoidResponse && (
                <div className="rounded-md bg-red-50 px-3 py-2 dark:bg-red-950">
                  <p className="text-[11px] font-medium text-red-700 dark:text-red-300">
                    이렇게 반응하지 않기
                  </p>
                  <p className="mt-0.5 text-sm text-red-900 dark:text-red-200">
                    “{item.avoidResponse}”
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ConversationGuideView({
  guide,
  context,
  onStartLive,
  onReset,
}: Props) {
  const [showBriefDetail, setShowBriefDetail] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {TRACK_LABELS[context.track]} · {context.memberName} · {context.duration}분
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-zinc-500 underline dark:text-zinc-400"
        >
          처음부터 다시
        </button>
      </div>

      <section className="rounded-lg border border-zinc-900 bg-zinc-900 px-6 py-5 dark:border-zinc-100 dark:bg-zinc-100">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          이번 면담의 핵심
        </p>
        <p className="mt-2 text-base leading-relaxed text-white dark:text-zinc-900">
          {guide.brief.summary}
        </p>

        <button
          type="button"
          onClick={() => setShowBriefDetail((prev) => !prev)}
          className="mt-4 text-xs text-zinc-400 underline dark:text-zinc-500"
        >
          {showBriefDetail ? "접기" : "확인된 사실 · 확인이 필요한 부분 보기"}
        </button>

        {showBriefDetail && (
          <div className="mt-4 grid gap-4 border-t border-zinc-700 pt-4 text-sm dark:border-zinc-300 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                확인된 사실
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-zinc-200 dark:text-zinc-700">
                {guide.brief.confirmedFacts?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                아직 확인이 필요한 부분
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-zinc-200 dark:text-zinc-700">
                {guide.brief.needsCheck?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-amber-400 dark:text-amber-600">
                면담 전에 내려놓을 판단
              </p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-zinc-200 dark:text-zinc-700">
                {guide.brief.watchOut?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          면담 흐름
        </h2>

        {guide.phases?.map((phase, index) => (
          <div
            key={index}
            className="rounded-lg border border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {phase.timeRange}
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {phase.title}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {phase.purpose}
            </p>

            <div className="mt-3 flex flex-col gap-2">
              {phase.questions?.map((question, questionIndex) => (
                <QuestionBlock key={questionIndex} item={question} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={onStartLive}
        className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        면담 중 실시간 도움 받기
      </button>
    </div>
  );
}
