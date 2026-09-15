import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  role: "leader" | "admin";
};

// 인가 판단은 전부 이 파일을 거친다.
// getSession()은 쿠키만 읽어 위조 가능하므로 쓰지 않고, getUser()로 Auth 서버에 재검증한다.
// React cache()로 같은 요청 안에서는 한 번만 호출된다.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, role")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
});

export const isAdmin = cache(async () => {
  const profile = await getProfile();
  return profile?.role === "admin";
});
