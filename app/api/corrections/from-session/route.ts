// app/api/corrections/from-session/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sid = searchParams.get("sid");
    if (!sid) return NextResponse.json({ error: "missing sid" }, { status: 400 });

    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    // 1) retrouver la submission payée par CET utilisateur
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .select("id,user_id")
      .eq("stripe_session_id", sid)
      .maybeSingle();

    if (subErr) {
      console.log("from-session submissions error:", subErr.message);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (!sub || sub.user_id !== auth.user.id) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // 2) prendre la dernière correction liée
    const { data: corr, error: corrErr } = await supabase
      .from("corrections")
      .select("id,status")
      .eq("submission_id", sub.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (corrErr) {
      console.log("from-session corrections error:", corrErr.message);
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (!corr) return NextResponse.json({ ready: false }, { status: 200 });

    return NextResponse.json({ ready: corr.status === "ready", correctionId: corr.id });
  } catch (e: any) {
    console.log("from-session exception:", e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
