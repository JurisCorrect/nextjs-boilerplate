// app/api/corrections/status/route.ts
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
    const url = new URL(req.url);
    const submissionId = url.searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "missing submissionId" }, { status: 400 });
    }

    const supabase = await getAdmin();

    // 1. Récupérer la dernière correction
    const { data: corr, error } = await supabase
      .from("corrections")
      .select("id,status,result_json,created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
    }

    // 2. Vérifier si cette correction est débloquée
    let isUnlocked = false;
    if (corr) {
      const { data: unlocked } = await supabase
        .from("unlocked_corrections")
        .select("id")
        .eq("correction_id", corr.id)
        .limit(1);

      isUnlocked = Boolean(unlocked && unlocked.length > 0);
    }

    // 3. Réponse selon l'état de la correction
    if (!corr) {
      return NextResponse.json({
        submissionId,
        status: "none",
        isUnlocked: false
      });
    }

    return NextResponse.json({
      submissionId,
      correctionId: corr.id,
      status: corr.status,
      isUnlocked,
      result: corr.status === "ready" ? corr.result_json : null,
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
