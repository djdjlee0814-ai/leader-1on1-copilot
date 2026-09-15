import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Google 로그인 후 돌아오는 지점. 인가 코드를 세션으로 교환한다.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) next = "/";

  // Vercel 뒤에서는 request.url이 내부 호스트라 x-forwarded-host를 우선한다.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const baseUrl =
    process.env.NODE_ENV === "production" && forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // 초대 목록에 없는 계정은 계정 생성 단계에서 막히고 여기로 온다.
  const reason = searchParams.get("error_description")?.includes("초대")
    ? "not_allowed"
    : "callback";
  return NextResponse.redirect(`${baseUrl}/login?error=${reason}`);
}
