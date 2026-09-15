import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 토큰 갱신은 proxy.ts 한 곳에서만 한다.
// 서버 컴포넌트와 API 라우트가 각자 쿠키를 다시 쓰면, 회전된 refresh token이 서로 충돌해
// 한쪽이 세션을 무효로 판단하고 쿠키를 지워버린다(로그인 직후 로그아웃되는 증상).
// 그래서 여기서는 쿠키를 읽기만 한다.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // 의도적으로 아무것도 하지 않는다. 쿠키 갱신은 proxy.ts가 담당한다.
        },
      },
    },
  );
}

// 로그인/로그아웃처럼 세션 쿠키를 실제로 발급하거나 지워야 하는 경로에서만 쓴다.
export async function createWritableClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
