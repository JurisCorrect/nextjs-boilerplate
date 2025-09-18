// app/api/corrections/from-session/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sid = searchParams.get("sid");
    if (!sid) return NextResponse.json({ error: "missing sid" }, { status: 400 });

    const supabase = await getAdmin();

    // 1) Retrouver la submission par stripe_session_id (aucune auth requise)
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .select("id")
      .eq("stripe_session_id", sid)
      .maybeSingle();

    if (subErr) {
      return NextResponse.json({ error: "db_error", details: subErr.message }, { status: 500 });
    }
    if (!sub) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 2) Dernière correction liée
    const { data: corr, error: corrErr } = await supabase
      .from("corrections")
      .select("id,status")
      .eq("submission_id", sub.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (corrErr) {
      return NextResponse.json({ error: "db_error", details: corrErr.message }, { status: 500 });
    }

    if (!corr) {
      // pas encore générée
      return NextResponse.json({ ready: false, submissionId: sub.id }, { status: 200 });
    }

    return NextResponse.json({
      ready: corr.status === "ready",
      correctionId: corr.id,
      submissionId: sub.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: e?.message || String(e) }, { status: 500 });
  }
}
