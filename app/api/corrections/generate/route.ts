// app/api/corrections/generate/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { generateDissertationCorrection } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔐 POST /api/corrections/generate
// body: { submissionId: string }
export async function POST(req: Request) {
  const supabase = getSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { submissionId } = await req.json().catch(() => ({}));
  if (!submissionId) {
    return NextResponse.json({ error: "submissionId requis" }, { status: 400 });
  }

  // 1) Récupérer la soumission
  const { data: submission, error: subErr } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (subErr || !submission) {
    return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
  }
  if (submission.user_id !== auth.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (submission.type !== "dissertation") {
    return NextResponse.json({ error: "Type non supporté ici" }, { status: 400 });
  }

  // 2) Méthodologie (placeholder simple) — à brancher plus tard sur ta vraie base
  const methodologyShort = `
DISERTATION — Règles essentielles (résumé d’amorçage) :
- Introduction structurée : accroche liée au sujet (à faire en dernier si besoin) ; définition précise des termes ; contexte utile ; intérêts & enjeux ; problématique DÉRIVÉE des enjeux ; annonce de plan (I) puis (II) sans "dans un premier temps".
- Plan en deux parties (I/ II/) avec A/ B/ ; titres nominaux, arrêto-centrés si nécessaire ; transitions soignées.
- Développement : idée → explication → rattachement aux notions/ textes/ jurisprudences pertinentes → illustration → nuance critique mesurée.
- Pas de conclusion en dissertation juridique.
- Langage rigoureux, précision des références, cohérence argumentative.
`.trim();

  // 3) Appel IA
  const result = await generateDissertationCorrection({
    course: submission.course,
    subject: submission.subject,
    content: submission.content,
    methodology: methodologyShort,
  });

  // 4) Enregistrer la correction
  const insertPayload = {
    submission_id: submission.id,
    status: "ready",
    result_json: result,        // nécessite colonne jsonb 'result_json' (créée à l’étape SQL)
  };

  const { data: inserted, error: insErr } = await supabase
    .from("corrections")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insErr) {
    return NextResponse.json({ error: "Insertion correction impossible" }, { status: 500 });
  }

  // 5) Marquer la soumission comme "processed"
  await supabase.from("submissions").update({ status: "processed" }).eq("id", submission.id);

  return NextResponse.json({ ok: true, correctionId: inserted.id, preview: result });
}
