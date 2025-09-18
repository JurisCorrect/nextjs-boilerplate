// app/api/corrections/resolve/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function error(status: number, msg: string, details?: any) {
  return NextResponse.json({ error: msg, details }, { status });
}

async function getAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const sid = u.searchParams.get("session_id") || u.searchParams.get("sid");
    if (!sid) return error(400, "missing_session_id");

    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    if (!STRIPE_SECRET_KEY) return error(500, "stripe_env_missing");

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.retrieve(sid);

    // On récupère l’ID de soumission que tu as mis dans client_reference_id
    const submissionId =
      (session.client_reference_id as string | null) ||
      (session.metadata?.submissionId as string | undefined) ||
      null;

    if (!submissionId) {
      return error(404, "submission_not_found_in_session", {
        session_id: sid,
        has_client_reference_id: !!session.client_reference_id,
        metadata: session.metadata || {},
      });
    }

    const supabase = await getAdmin();
    const { data: corr, error: dbErr } = await supabase
      .from("corrections")
      .select("id,status,submission_id")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbErr) return error(500, "db_error", dbErr.message);
    if (!corr) return error(404, "correction_not_found_for_submission", { submissionId });

    return NextResponse.json({
      ok: true,
      correctionId: corr.id,
      submissionId,
      status: corr.status,
    });
  } catch (e: any) {
    return error(500, "server_error", e?.message || String(e));
  }
}
