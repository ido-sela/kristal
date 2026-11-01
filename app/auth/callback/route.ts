import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const host = req.headers.get("x-forwarded-host") ?? req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const next = req.nextUrl.searchParams.get("next");
  const dest = next && /^\/[a-z]/.test(next) && !next.startsWith("//") ? next : "/";
  const base = `${proto}://${host}`;
  if (code) {
    const sb = await createClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${dest}`);
  }
  return NextResponse.redirect(`${base}/login?error=1`);
}
