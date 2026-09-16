// 화면 전체가 같은 규칙을 쓰도록 모아 둔 스타일 상수.
// 테두리는 헤어라인 하나, 그림자는 쓰지 않고, 강조색은 꼭 필요한 곳에만 쓴다.

export const label = "block text-[13px] font-medium text-ink";

export const field =
  "field mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[14px] leading-relaxed text-ink placeholder:text-ink-faint transition-colors";

export const helper = "mt-1.5 text-[12.5px] leading-relaxed text-ink-faint";

export const btnPrimary =
  "rounded-lg bg-accent px-5 py-3 text-[14px] font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-35";

export const btnSecondary =
  "rounded-lg border border-line bg-surface px-4 py-2.5 text-[13px] font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-35";

export const btnQuiet =
  "text-[12.5px] text-ink-faint underline underline-offset-2 transition-colors hover:text-ink-muted";

// 선택 가능한 항목: 검은 블록 대신 강조색 테두리 + 옅은 배경
export function selectable(active: boolean) {
  return active
    ? "border-accent bg-accent-soft text-ink"
    : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink";
}

export const panel = "rounded-xl border border-line bg-surface";
