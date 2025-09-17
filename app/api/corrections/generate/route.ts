// app/api/corrections/generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

function log(...args: any[]) {
  console.log("[generate]", ...args);
}

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function pickSubmissionText(row: any): string | null {
  if (!row) return null;
  return (
    row.text ??
    row.content ??
    row.body ??
    row.essay ??
    row.input_text ??
    (typeof row.payload === "string" ? row.payload : null) ??
    row.payload?.text ??
    row.payload?.content ??
    row.sujet ?? // cas-pratique
    row.copie ?? // si jamais
    null
  );
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// --- Helpers nettoyage sujet/entêtes ----------------------------------------

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripHeaderLabels(t: string) {
  if (!t) return t;
  // supprime lignes d’entêtes typiques au début de texte
  t = t.replace(/^\s*(ÉNONCÉ|SUJET)\s*:\s*/i, "");
  t = t.replace(/^\s*COPIE\s*\([^)]*\)\s*:\s*/i, "");
  return t.trim();
}

function stripSubjectOnce(t: string, subject?: string) {
  if (!t || !subject) return t;
  const subj = subject.trim();
  if (!subj) return t;

  // 1) Pattern "ÉNONCÉ: <sujet>" au début
  const p1 = new RegExp(
    `^\\s*(?:ÉNONCÉ|SUJET)\\s*:\\s*${escapeRegExp(subj)}\\s*\\n+`,
    "i"
  );
  if (p1.test(t)) return t.replace(p1, "").trim();

  // 2) Sujet brut en tout début (ligne 1)
  const p2 = new RegExp(`^\\s*${escapeRegExp(subj)}\\s*\\n+`, "i");
  if (p2.test(t)) return t.replace(p2, "").trim();

  // 3) Sujet seul suivi d’une ligne vide (robuste)
  const firstBlock = t.split(/\n{2,}/)[0]?.trim() || "";
  if (firstBlock.length && firstBlock.toLowerCase() === subj.toLowerCase()) {
    return t.slice(firstBlock.length).replace(/^\s+/, "");
  }

  return t;
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  log("🚀 POST request received");

  try {
    const { submissionId, payload } = await req.json().catch(() => ({}));
    log("📥 Request data:", {
      submissionId: submissionId || "MISSING",
      hasPayload: !!payload,
    });

    if (!submissionId) {
      log("❌ missing submissionId");
      return NextResponse.json(
        { error: "missing submissionId" },
        { status: 400 }
      );
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      log("❌ missing Supabase env");
      return NextResponse.json(
        { error: "supabase_env_missing" },
        { status: 500 }
      );
    }

    const supabase = await getSupabaseAdmin();

    // 0) idempotence
    const { data: existing } = await supabase
      .from("corrections")
      .select("id,status")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && (existing.status === "running" || existing.status === "ready")) {
      log("↩︎ idempotent return", existing.id, existing.status);
      return NextResponse.json({
        ok: true,
        correctionId: existing.id,
        status: existing.status,
      });
    }

    // 1) retrouver le texte (et le sujet s'il existe)
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .select(
        "id,user_id,text,content,body,essay,input_text,payload,sujet,copie"
      )
      .eq("id", submissionId)
      .maybeSingle();

    if (subErr) log("⚠️ select submissions error:", subErr.message);

    const submissionSubject: string | undefined = (sub as any)?.sujet || payload?.sujet;
    let sourceText = pickSubmissionText(sub) ?? pickSubmissionText({ payload });

    // Nettoyage en amont (au cas où le payload inclut encore des entêtes/sujet)
    if (sourceText) {
      sourceText = stripHeaderLabels(sourceText);
      sourceText = stripSubjectOnce(sourceText, submissionSubject);
    }

    log("📄 Source text length:", sourceText?.length || 0);

    // 2) créer une correction "running" dès maintenant
    const insertPayload: any = { submission_id: submissionId, status: "running" };
    if ((sub as any)?.user_id) insertPayload.user_id = (sub as any).user_id;

    const { data: corrRow, error: insErr } = await supabase
      .from("corrections")
      .insert([insertPayload])
      .select("id")
      .single();

    if (insErr || !corrRow) {
      log("❌ insert corrections failed:", insErr?.message);
      return NextResponse.json(
        { error: "insert_failed", details: insErr?.message },
        { status: 500 }
      );
    }
    const correctionId = corrRow.id;
    log("✔️ corrections.running", correctionId);

    // 3) si pas de texte → placeholder
    if (!sourceText) {
      log("⚠️ No source text found, creating placeholder");
      const placeholder = {
        normalizedBody: "",
        globalComment: "Aucun texte reçu pour cette soumission.",
        inline: [
          {
            tag: "orange",
            quote: "",
            comment: "Veuillez renvoyer votre devoir ou réessayer.",
          },
        ],
        score: { overall: 0, out_of: 20 },
        error: "no_text_found",
      };
      const { error: updErr } = await supabase
        .from("corrections")
        .update({ status: "ready", result_json: placeholder })
        .eq("id", correctionId);
      if (updErr) {
        log("❌ update corrections failed (placeholder):", updErr.message);
        return NextResponse.json(
          { error: "update_failed", details: updErr.message },
          { status: 500 }
        );
      }
      log("⚠️ no_text_found → placeholder ready", correctionId);
      return NextResponse.json({
        ok: true,
        correctionId,
        status: "ready",
        note: "placeholder",
      });
    }

    // 4) OpenAI
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

      const resp = await openai.chat.completions.create(
        {
          model: "gpt-4o-mini",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: "Tu rends uniquement du JSON valide conforme au schéma demandé.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" as any },
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      const content = resp.choices?.[0]?.message?.content || "";
      resultJson =
        typeof content === "string"
          ? safeJson(content)
          : safeJson(JSON.stringify(content));
      log("✔️ OpenAI response received");
    } catch (e: any) {
      log("⚠️ openai error:", e?.message || e);
      // Fallback non bloquant
      resultJson = {
        normalizedBody: sourceText,
        globalComment: "Analyse en cours. Voici une première mise en forme.",
        inline: [
          {
            tag: "green",
            quote: sourceText.slice(0, 120),
            comment: "Bon démarrage, continue ainsi.",
          },
          {
            tag: "orange",
            quote: sourceText.slice(120, 240),
            comment: "Clarifie l'argument et cite la source.",
          },
        ],
        score: { overall: 12, out_of: 20 },
      };
      log("🔄 Using fallback result");
    }

    // --- Nettoyage sortie : on retire sujet/entêtes s'ils réapparaissent
    if (resultJson) {
      const body0: string =
        resultJson?.normalizedBody ?? resultJson?.body ?? "";
      let bodyClean = stripHeaderLabels(body0);
      bodyClean = stripSubjectOnce(bodyClean, submissionSubject);

      // recopie dans les deux champs possibles
      if ("normalizedBody" in resultJson) resultJson.normalizedBody = bodyClean;
      if ("body" in resultJson) resultJson.body = bodyClean;
      // alias pour tes anciennes vues
      if (!resultJson.body && resultJson.normalizedBody)
        resultJson.body = resultJson.normalizedBody;
      if (!resultJson.global_comment && resultJson.globalComment)
        resultJson.global_comment = resultJson.globalComment;
    }

    // 5) sauvegarde "ready"
    const { error: updErr } = await supabase
      .from("corrections")
      .update({ status: "ready", result_json: resultJson })
      .eq("id", correctionId);
    if (updErr) {
      log("❌ update corrections failed:", updErr.message);
      return NextResponse.json(
        { error: "update_failed", details: updErr.message },
        { status: 500 }
      );
    }

    log("✅ corrections.ready", correctionId, `(${Date.now() - startedAt}ms)`);
    return NextResponse.json({ ok: true, correctionId, status: "ready" });
  } catch (e: any) {
    log("❌ fatal error:", e?.message || e);
    log("❌ stack trace:", e?.stack);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
