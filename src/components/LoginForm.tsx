"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { btnPrimary, btnSecondary, field, label } from "@/lib/ui";

// Google provider 설정이 끝나기 전에는 버튼을 숨긴다.
// 설정이 끝나면 NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true 로 켠다.
const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export default function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ?? "");

  async function handleGoogle() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signInError) {
      setError(
        signInError.message.includes("provider is not enabled")
          ? "Google 로그인이 아직 설정되지 않았습니다. 이메일로 로그인해주세요."
          : signInError.message,
      );
      setLoading(false);
    }
  }

  async function handlePassword(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className={btnSecondary}
          >
            Google 계정으로 로그인
          </button>

          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[12px] text-ink-faint">또는</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={handlePassword} className="flex flex-col gap-5">
        <div>
          <label className={label}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            className={field}
          />
        </div>
        <div>
          <label className={label}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className={field}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className={`mt-1 ${btnPrimary}`}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {error && (
        <p className="border-l-2 border-negative bg-negative-soft px-4 py-3 text-[13px] leading-relaxed text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
