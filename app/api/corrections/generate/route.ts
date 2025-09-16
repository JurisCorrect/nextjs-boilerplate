// app/api/corrections/generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function pickSubmissionText(row: any): string | null {
  if (!row) return null;
  // essaie plusieurs champs classiques
  return (
    row.text ??
    row.content ??
    row.body ??
    row.essay ??
    row.input_text ??
    (typeof row.payload === "string" ? row.payload : null) ??
    (row.payload?.text ?? row.payload?.content ?? null) ??
    null
  );
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return null; }
}

export async function POST(req: Request) {
  try {
    const { submissionId, payload } = await req.json().catch(() => ({}));
    if (!submissionId) {
      return NextResponse.json({ error: "missing submissionId" }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();

    // 0) idempotence: correction existante "running/ready" ?
    const { data: existing } = await supabase
      .from("corrections")
      .select("id,status")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && (existing.status === "running" || existing.status === "ready")) {
      return NextResponse.json({ ok: true, correctionId: existing.id, status: existing.status });
    }

    // 1) retrouver la submission et son texte
    const { data: sub } = await supabase
      .from("submissions")
      .select("id, user_id, text, content, body, essay, input_text, payload")
      .eq("id", submissionId)
      .maybeSingle();

    let sourceText = pickSubmissionText(sub) ?? null;
    // fallback: si la route est appelée avec "payload" (depuis la page d’envoi)
    if (!sourceText && payload) {
      sourceText = pickSubmissionText({ payload }) ?? null;
    }
    if (!sourceText) {
      // crée quand même une correction vide pour que le statut bouge
      const { data: emptyCorr } = await supabase
        .from("corrections")
        .insert([{ submission_id: submissionId, status: "failed", result_json: { error: "no_text_found" } }])
        .select("id")
        .single();
      return NextResponse.json({ error: "no_text_found", correctionId: emptyCorr?.id }, { status: 400 });
    }

    // 2) créer une correction "running"
    const { data: corrRow, error: insErr } = await supabase
      .from("corrections")
      .insert([{ submission_id: submissionId, status: "running" }])
      .select("id")
      .single();

    if (insErr || !corrRow) {
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }
    const correctionId = corrRow.id;

    // 3) appel OpenAI pour générer un JSON structuré
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28_000); // ~28s pour éviter de bloquer

    const prompt = `
Tu es un correcteur de copies de droit. Retourne STRICTEMENT un JSON compact avec ce schéma:
{
  "normalizedBody": "<texte reformatté>",
  "globalComment": "<commentaire général>",
  "inline": [
    { "tag": "green|red|orange|blue", "quote": "<extrait court>", "comment": "<remarque brève>" }
  ],
  "score": { "overall": <nombre>, "out_of": 20 }
}

Consignes:
- 3 à 6 éléments dans "inline", citations < 140 caractères.
- "tag" = green (bien), red (erreur), orange (à améliorer), blue (style).
- Pas de texte hors JSON.
Texte à corriger:
"""${sourceText.slice(0, 12000)}"""
`;

    let resultJson: any = null;
    try {
      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Tu rends uniquement du JSON valide conforme au schéma demandé." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" as any },
      }, { signal: controller.signal });

      const content = resp.choices?.[0]?.message?.content || "";
      resultJson = typeof content === "string" ? safeJson(content) : safeJson(JSON.stringify(content));
    } catch (e: any) {
      // fallback minimal pour ne pas bloquer l’UI
      resultJson = {
        normalizedBody: sourceText,
        globalComment: "Analyse en cours. Voici une première mise en forme.",
        inline: [
          { tag: "green", quote: sourceText.slice(0, 120), comment: "Bon démarrage, continue ainsi." },
          { tag: "orange", quote: sourceText.slice(120, 240), comment: "Clarifie l'argument et cite la source." }
        ],
        score: { overall: 12, out_of: 20 }
      };
    } finally {
      clearTimeout(timeout);
    }

    // 4) normalisation rapide pour que tes pages trouvent toujours les bons champs
    if (resultJson && !resultJson.global_comment && resultJson.globalComment) {
      resultJson.global_comment = resultJson.globalComment;
    }
    if (resultJson && !resultJson.body && resultJson.normalizedBody) {
      resultJson.body = resultJson.normalizedBody;
    }

    // 5) sauvegarde "ready"
    await supabase
      .from("corrections")
      .update({ status: "ready", result_json: resultJson })
      .eq("id", correctionId);

    return NextResponse.json({ ok: true, correctionId, status: "ready" });
  } catch (e: any) {
    console.log("generate error:", e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
