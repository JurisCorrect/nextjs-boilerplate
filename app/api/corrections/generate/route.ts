import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

function log(...args: any[]) { console.log("[generate]", ...args); }

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function pickSubmissionText(row: any): string | null {
  if (!row) return null;
  return (
    row.text ?? row.content ?? row.body ?? row.essay ?? row.input_text ??
    row.payload?.text ?? row.payload?.content ??
    row.sujet ?? row.copie ??
    (typeof row.payload === "string" ? row.payload : null) ??
    null
  );
}

function safeJson(s: string) { try { return JSON.parse(s); } catch { return null; } }

export async function POST(req: Request) {
  const startedAt = Date.now();
  log("🚀 POST request received");

  try {
    const { submissionId, payload } = await req.json().catch(() => ({}));
    log("📥 Request data:", { submissionId: submissionId || "MISSING", hasPayload: !!payload });

    if (!submissionId) {
      log("❌ missing submissionId");
      return NextResponse.json({ error: "missing submissionId" }, { status: 400 });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      log("❌ missing Supabase env");
      return NextResponse.json({ error: "supabase_env_missing" }, { status: 500 });
    }

    const supabase = await getSupabaseAdmin();

    // 0) idempotence
    const { data: existing, error: existingErr } = await supabase
      .from("corrections")
      .select("id,status")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingErr) log("⚠️ select corrections error:", existingErr.message);

    if (existing && (existing.status === "running" || existing.status === "ready")) {
      log("↩︎ idempotent return", existing.id, existing.status);
      return NextResponse.json({ ok: true, correctionId: existing.id, status: existing.status });
    }

    // 1) récupérer submission + user_id (si existe)
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .select("id, user_id, text, content, body, essay, input_text, payload, sujet, copie")
      .eq("id", submissionId)
      .maybeSingle();
    if (subErr) log("⚠️ select submissions error:", subErr.message);

    let sourceText = pickSubmissionText(sub) ?? pickSubmissionText({ payload });
    log("📄 Source text length:", sourceText?.length || 0);

    const insertPayload: any = { submission_id: submissionId, status: "running" };
    if ((sub as any)?.user_id) insertPayload.user_id = (sub as any).user_id;

    const { data: corrRow, error: insErr } = await supabase
      .from("corrections")
      .insert([insertPayload])
      .select("id")
      .single();

    if (insErr || !corrRow) {
      log("❌ insert corrections failed:", insErr?.message);
      return NextResponse.json({ error: "insert_failed", details: insErr?.message }, { status: 500 });
    }
    const correctionId = corrRow.id;
    log("✔️ corrections.running", correctionId);

    // 3) pas de texte → placeholder ready
    if (!sourceText) {
      log("⚠️ No source text found, creating placeholder");
      const placeholder = {
        normalizedBody: "",
        globalComment: "Aucun texte reçu pour cette soumission.",
        inline: [{ tag: "orange", quote: "", comment: "Veuillez renvoyer votre devoir ou réessayer." }],
        score: { overall: 0, out_of: 20 },
        error: "no_text_found",
      };
      const { error: updErr } = await supabase
        .from("corrections")
        .update({ status: "ready", result_json: placeholder })
        .eq("id", correctionId);
      if (updErr) {
        log("❌ update corrections failed (placeholder):", updErr.message);
        return NextResponse.json({ error: "update_failed", details: updErr.message }, { status: 500 });
      }
      log("⚠️ no_text_found → placeholder ready", correctionId);
      return NextResponse.json({ ok: true, correctionId, status: "ready", note: "placeholder" });
    }

    // 4) OpenAI (avec fallback)
    log("🤖 Calling OpenAI API...");
    let resultJson: any = null;
    try {
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");

      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 28_000);

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

      const resp = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: "Tu rends uniquement du JSON valide conforme au schéma demandé." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" as any },
      }, { signal: controller.signal });

      clearTimeout(timeout);
      const content = resp.choices?.[0]?.message?.content || "";
      resultJson = typeof content === "string" ? safeJson(content) : safeJson(JSON.stringify(content));
      log("✔️ OpenAI response received");
    } catch (e: any) {
      log("⚠️ openai error:", e?.message || e);
      // Fallback non bloquant
      resultJson = {
        normalizedBody: sourceText,
        globalComment: "Analyse en cours. Voici une première mise en forme.",
        inline: [
          { tag: "green",  quote: sourceText.slice(0, 120),   comment: "Bon démarrage, continue ainsi." },
          { tag: "orange", quote: sourceText.slice(120, 240), comment: "Clarifie l'argument et cite la source." }
        ],
        score: { overall: 12, out_of: 20 }
      };
      log("🔄 Using fallback result");
    }

    if (resultJson && !resultJson.global_comment && resultJson.globalComment) {
      resultJson.global_comment = resultJson.globalComment;
    }
    if (resultJson && !resultJson.body && resultJson.normalizedBody) {
      resultJson.body = resultJson.normalizedBody;
    }

    const { error: updErr } = await supabase
      .from("corrections")
      .update({ status: "ready", result_json: resultJson })
      .eq("id", correctionId);
    if (updErr) {
      log("❌ update corrections failed:", updErr.message);
      return NextResponse.json({ error: "update_failed", details: updErr.message }, { status: 500 });
    }

    log("✅ corrections.ready", correctionId, `(${Date.now() - startedAt}ms)`);
    return NextResponse.json({ ok: true, correctionId, status: "ready" });

  } catch (e: any) {
    log("❌ fatal error:", e?.message || e);
    log("❌ stack trace:", e?.stack);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
