import { NextResponse } from "next/server";
import { createWritableClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET이 아니라 POST로 받는다. 링크 프리페치만으로 로그아웃되는 것을 막기 위함이다.
export async function POST(request: Request) {
  const supabase = await createWritableClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
