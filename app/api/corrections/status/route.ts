// app/api/corrections/status/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Active le contrôle strict de propriété si tu veux bloquer les non-propriétaires
const ENFORCE_OWNER = false;

function previewFromResult(r: any) {
  const inline = Array.isArray(r?.inline) ? r.inline.slice(0, 3) : [];
  const global_intro = (r?.globalComment ?? r?.global_comment ?? "").slice(0, 500);
  const score = r?.score ?? null;
  return { inline, global_intro, score };
}

// Helper : récupère l'user_id quelle que soit la forme renvoyée par Supabase
function getOwnerId(submissions: any): string | null {
  if (!submissions) return null;
  if (Array.isArray(submissions)) return submissions[0]?.user_id ?? null;
  return submissions.user_id ?? null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");
    const correctionId  = searchParams.get("correctionId");

    if (!submissionId && !correctionId) {
      return NextResponse.json({ error: "missing id" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id || null;

    // ── Lookup via correctionId
    if (correctionId) {
      const { data: row } = await supabase
        .from("corrections")
        .select("id,status,result_json,submission_id,submissions!inner(id,user_id)")
        .eq("id", correctionId)
        .maybeSingle();

      if (!row) return NextResponse.json({ status: "pending" });

      const ownerId = getOwnerId((row as any).submissions);
      if (ENFORCE_OWNER && ownerId && userId && ownerId !== userId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      const res: any = { status: row.status ?? "running", correctionId: row.id };
      if ((row as any).result_json) res.preview = previewFromResult((row as any).result_json);
      return NextResponse.json(res);
    }

    // ── Lookup via submissionId
    const { data: row } = await supabase
      .from("corrections")
      .select("id,status,result_json,submission_id,submissions!inner(id,user_id)")
      .eq("submission_id", submissionId!)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) return NextResponse.json({ status: "pending" });

    const ownerId = getOwnerId((row as any).submissions);
    if (ENFORCE_OWNER && ownerId && userId && ownerId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const res: any = { status: row.status ?? "running", correctionId: row.id };
    if ((row as any).result_json) res.preview = previewFromResult((row as any).result_json);
    return NextResponse.json(res);
  } catch (e: any) {
    console.log("status exception:", e?.message || e);
    return NextResponse.json({ status: "pending" });
  }
}
