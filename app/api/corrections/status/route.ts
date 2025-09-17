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

    // 1) tentative avec la colonne status
    let sel = await supabase
      .from("corrections")
      .select("id,status,result_json,created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2) fallback si la colonne n'existe pas encore (anciens schémas)
    if (sel.error && /column .*status/i.test(sel.error.message || "")) {
      sel = await supabase
        .from("corrections")
        .select("id,result_json,created_at")
        .eq("submission_id", submissionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    }

    const { data: corr, error } = sel;

    if (error) {
      return NextResponse.json(
        { error: "db_error", details: error.message },
        { status: 500 }
      );
    }

    if (!corr) {
      return NextResponse.json(
        { status: "none" },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Si status est nul/absent, déduire à partir du contenu
    const computedStatus =
      (corr as any).status ??
      ((corr as any).result_json ? "ready" : "running");

    return NextResponse.json(
      {
        correctionId: (corr as any).id,
        status: computedStatus,
        result: computedStatus === "ready" ? (corr as any).result_json : null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
