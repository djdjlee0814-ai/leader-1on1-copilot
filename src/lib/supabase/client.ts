import { createBrowserClient } from "@supabase/ssr";

// 브라우저에서 쓰는 Supabase 클라이언트.
// createBrowserClient가 내부적으로 싱글턴을 관리하므로 매번 호출해도 된다.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
