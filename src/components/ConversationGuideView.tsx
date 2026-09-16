"use client";

import { useState } from "react";
import { btnQuiet, btnSecondary } from "@/lib/ui";
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
    <div>
      {/* 면담 중에는 이 문장 하나만 보면 되도록 가장 크게 둔다 */}
      <p className="text-[18px] font-medium leading-[1.6] tracking-tight text-ink">
        {item.question}
      </p>

      {item.leaderTip && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
          {item.leaderTip}
        </p>
      )}

      {hasFollowUps && (
        <>
          <button type="button" onClick={() => setOpen((prev) => !prev)} className={`mt-3 ${btnQuiet}`}>
            {open ? "접기" : "직원이 이렇게 답한다면?"}
          </button>

          {open && (
            <div className="mt-4 flex flex-col gap-4 border-l border-line pl-4">
              {item.followUps?.map((branch, index) => (
                <div key={index}>
                  <p className="text-[13px] leading-relaxed text-ink-faint">
                    “{branch.employeeResponse}”
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink">
                    {branch.suggestedFollowUp}
                  </p>
                </div>
              ))}

              {item.avoidResponse && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-negative">
                    피하기
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">
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
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          {context.memberName}
          <span className="ml-3 text-[14px] font-normal text-ink-faint">
            {TRACK_LABELS[context.track]} · {context.duration}분
          </span>
        </h1>
        <button type="button" onClick={onReset} className={btnQuiet}>
          처음부터 다시
        </button>
      </div>

      {/* 이번 면담의 핵심: 검은 배너 대신 강조선 하나로 조용하게 */}
      <section className="mt-8 border-l-2 border-accent pl-5">
        <p className="eyebrow">이번 면담의 핵심</p>
        <p className="mt-2.5 text-[17px] leading-[1.7] tracking-tight text-ink">
          {guide.brief.summary}
        </p>

        <button
          type="button"
          onClick={() => setShowBriefDetail((prev) => !prev)}
          className={`mt-4 ${btnQuiet}`}
        >
          {showBriefDetail ? "접기" : "확인된 사실 · 확인이 필요한 부분 보기"}
        </button>

        {showBriefDetail && (
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow">확인된 사실</p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                {guide.brief.confirmedFacts?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">아직 확인이 필요한 부분</p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                {guide.brief.needsCheck?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2">
              <p className="eyebrow" style={{ color: "var(--caution)" }}>
                면담 전에 내려놓을 판단
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-muted">
                {guide.brief.watchOut?.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* 면담 흐름: 카드 대신 왼쪽에 시간 레일을 둔 타임라인 */}
      <section className="mt-14">
        <p className="eyebrow">면담 흐름</p>

        <div className="mt-6 flex flex-col">
          {guide.phases?.map((phase, index) => (
            <div
              key={index}
              className="grid gap-x-6 gap-y-3 border-t border-line py-8 sm:grid-cols-[92px_1fr]"
            >
              <div className="sm:pt-0.5">
                <p className="text-[13px] font-medium tabular-nums text-ink">
                  {phase.timeRange}
                </p>
                <p className="mt-1 text-[13px] text-ink-faint">{phase.title}</p>
              </div>

              <div>
                <p className="text-[13px] leading-relaxed text-ink-muted">
                  {phase.purpose}
                </p>
                <div className="mt-5 flex flex-col gap-8">
                  {phase.questions?.map((question, questionIndex) => (
                    <QuestionBlock key={questionIndex} item={question} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <button type="button" onClick={onStartLive} className={btnSecondary}>
          면담 중 실시간 도움 받기
        </button>
      </div>
    </div>
  );
}
