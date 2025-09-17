import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function admin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  try {
    const submissionId = ctx.params.id;
    if (!submissionId) return NextResponse.json({ error: "missing id" }, { status: 400 });
    const supa = await admin();

    // crée une correction si inexistante
    const { data: corr } = await supa
      .from("corrections")
      .select("id,status")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!corr) {
      await supa.from("corrections").insert([{ submission_id: submissionId, status: "running" }]);
    }

    const demo = {
      normalizedBody: "Démo de corps de correction (READY).",
      globalComment: "Ceci est un jeu de données de test (force-ready).",
      inline: [{ tag: "green", quote: "Extrait", comment: "OK" }],
      score: { overall: 14, out_of: 20 },
    };

    const { error: updErr } = await supa
      .from("corrections")
      .update({ status: "ready", result_json: demo })
      .eq("submission_id", submissionId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, submissionId }, { headers: { "Cache-Control": "no-store" }});
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
