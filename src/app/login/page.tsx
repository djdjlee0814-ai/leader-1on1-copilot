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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Leader 1:1 Copilot
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          더 나은 1:1을 위한 리더의 AI 대화 파트너
        </p>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <LoginForm initialError={error ? ERROR_MESSAGES[error] : undefined} />
        </div>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          초대된 사내 구성원만 이용할 수 있습니다.
        </p>
      </main>
    </div>
  );
}
