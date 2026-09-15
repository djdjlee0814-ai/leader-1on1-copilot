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
          <header className="flex items-center justify-end gap-3 border-b border-zinc-200 bg-white px-4 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950 sm:px-8">
            <span className="text-zinc-600 dark:text-zinc-400">
              {profile.display_name ?? profile.email}
              {profile.role === "admin" && (
                <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                  관리자
                </span>
              )}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-full border border-zinc-300 px-3 py-1 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                로그아웃
              </button>
            </form>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
