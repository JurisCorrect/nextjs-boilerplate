import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const has = (k: string) => Boolean(process.env[k as keyof NodeJS.ProcessEnv]);
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { error } = await admin.from("corrections").select("id").limit(1);
    return NextResponse.json({
      ok: true,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: has("NEXT_PUBLIC_SUPABASE_URL"),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: has("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        SUPABASE_SERVICE_ROLE_KEY: has("SUPABASE_SERVICE_ROLE_KEY"),
        OPENAI_API_KEY: has("OPENAI_API_KEY"),
        STRIPE_SECRET_KEY: has("STRIPE_SECRET_KEY"),
        NEXT_PUBLIC_SITE_URL: has("NEXT_PUBLIC_SITE_URL"),
      },
      supabase_select_ok: !error,
      supabase_select_error: error?.message || null,
    }, { headers: { "Cache-Control": "no-store" }});
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
