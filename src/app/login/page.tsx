import LoginForm from "@/components/LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: "초대된 사용자만 이용할 수 있습니다. 관리자에게 문의해주세요.",
  callback: "로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <main className="w-full max-w-[360px]">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          Leader 1:1 Copilot
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          더 나은 1:1을 위한 리더의 AI 대화 파트너
        </p>

        <div className="mt-10">
          <LoginForm initialError={error ? ERROR_MESSAGES[error] : undefined} />
        </div>

        <p className="mt-8 text-[12.5px] text-ink-faint">
          초대된 사내 구성원만 이용할 수 있습니다.
        </p>
      </main>
    </div>
  );
}
