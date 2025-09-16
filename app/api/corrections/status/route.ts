import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const submissionId = searchParams.get("submissionId");
  const correctionId  = searchParams.get("correctionId");

  if (!submissionId && !correctionId) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // 1) si on donne correctionId, on vérifie son état
  if (correctionId) {
    const { data } = await supabase
      .from("corrections")
      .select("id, status")
      .eq("id", correctionId)
      .maybeSingle();

    if (!data) return NextResponse.json({ status: "not_found" });
    return NextResponse.json({ status: data.status, correctionId: data.id });
  }

  // 2) si on donne submissionId, on cherche la correction liée
  const { data } = await supabase
    .from("corrections")
    .select("id, status")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ status: "pending" }); // pas encore créée
  return NextResponse.json({ status: data.status, correctionId: data.id });
}
