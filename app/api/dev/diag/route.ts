import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    VERCEL_URL: !!process.env.VERCEL_URL,
    NEXT_PUBLIC_BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
  };

  // ping très léger sur les tables (sans dévoiler de données)
  let canReadCorrections = false;
  let canReadSubmissions = false;
  try {
    const { data } = await supabase.from("corrections").select("id").limit(1);
    canReadCorrections = Array.isArray(data);
  } catch {}
  try {
    const { data } = await supabase.from("submissions").select("id").limit(1);
    canReadSubmissions = Array.isArray(data);
  } catch {}

  return NextResponse.json({
    ok: true,
    now: new Date().toISOString(),
    loggedIn: !!auth?.user,
    env,
    db: { canReadCorrections, canReadSubmissions },
  });
}
