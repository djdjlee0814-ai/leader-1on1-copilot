import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16부터 middleware가 proxy로 이름이 바뀌었다.
// 서버 컴포넌트는 쿠키를 쓸 수 없으므로, 만료된 토큰 갱신은 여기서 처리한다.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = pathname.startsWith("/login") || pathname.startsWith("/auth");

  // API는 리디렉트하지 않는다. fetch 응답이 로그인 HTML로 바뀌면 화면에서 처리할 수 없으므로,
  // 각 Route Handler가 직접 401을 반환하게 둔다.
  if (!user && !isPublicPath && !pathname.startsWith("/api")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 쿠키를 붙인 바로 이 응답 객체를 반환해야 갱신된 세션이 유지된다.
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
