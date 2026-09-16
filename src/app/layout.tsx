import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getProfile } from "@/lib/auth/dal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leader 1:1 Copilot",
  description: "더 나은 1:1을 위한 리더의 AI 대화 파트너",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {profile && (
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-3 sm:px-8">
              <span className="text-[13px] font-medium tracking-tight text-ink">
                Leader 1:1 Copilot
              </span>
              <div className="flex items-center gap-4">
                <span className="text-[12.5px] text-ink-muted">
                  {profile.display_name ?? profile.email}
                  {profile.role === "admin" && (
                    <span className="ml-2 text-[11px] text-ink-faint">관리자</span>
                  )}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-[12.5px] text-ink-faint transition-colors hover:text-ink"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            </div>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
