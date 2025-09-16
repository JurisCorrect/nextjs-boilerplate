// app/api/corrections/generate/route.ts
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ---- Zod: 2 schémas possibles ---- */
const DirectPayload = z.object({
  exerciseType: z.enum(["dissertation", "commentaire", "cas", "fiche"]),
  subject: z.string().min(3, "Sujet trop court"),
  course: z.string().min(2, "Matière requise"),
  text: z.string().min(50, "Texte trop court pour une correction utile"),
  submissionId: z.string().optional(),
});

const FireAndForgetPayload = z.object({
  submissionId: z.string().min(1),
});

const Payload = z.union([DirectPayload, FireAndForgetPayload]);

/** ---- Supabase admin (service-role) pour recharger la soumission ----
 *  Vars requises dans ton projet:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY  (⚠️ secret)
 */
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Adapte ICI le nom de table + colonnes si besoin */
async function loadSubmissionFromDB(submissionId: string) {
  const sb = supabaseAdmin();
  if (!sb)
    throw new Error(
      "Supabase non configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants)."
    );

  // ⚠️ Adapte 'submissions' et les noms de colonnes à ton schéma
  const { data, error } = await sb
    .from("submissions")
    .select("id, exercise_type, subject, course, text")
    .eq("id", submissionId)
    .single();

  if (error || !data) throw new Error("Submission introuvable en base.");

  // Remappe vers nos clés attendues
  return {
    submissionId: data.id as string,
    exerciseType: (data.exercise_type ?? "dissertation") as
      | "dissertation"
      | "commentaire"
      | "cas"
      | "fiche",
    subject: data.subject as string,
    course: data.course as string,
    text: data.text as string,
  };
}

export async function POST(req: NextRequest) {
  // 1) Lire & valider
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = Payload.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // 2) Normaliser les données d'entrée
  let submissionId: string | undefined;
  let exerciseType: "dissertation" | "commentaire" | "cas" | "fiche";
  let subject: string;
  let course: string;
  let text: string;

  if ("submissionId" in parsed.data && Object.keys(parsed.data).length === 1) {
    // Mode fire & forget : on recharge depuis la DB
    const s = await loadSubmissionFromDB(parsed.data.submissionId);
    submissionId = s.submissionId;
    exerciseType = s.exerciseType;
    subject = s.subject;
    course = s.course;
    text = s.text;
  } else {
    // Mode direct : tout est déjà fourni
    const d = parsed.data as z.infer<typeof DirectPayload>;
    submissionId = d.submissionId;
    exerciseType = d.exerciseType;
    subject = d.subject;
    course = d.course;
    text = d.text;
  }

  // 3) Clé OpenAI check
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY manquante. Ajoute la variable d’environnement sur Vercel puis redeploie.",
      },
      { status: 500 }
    );
  }
  const openai = new OpenAI({ apiKey });

  // 4) Prompt (tu pourras l’enrichir plus tard)
  const system = [
    "Tu es JurisCorrect, correcteur juridique.",
    "Tu ne fais jamais le devoir, tu corriges et expliques la méthode.",
    "Style professeur universitaire, sans émoticônes, vouvoiement.",
    "Réponds en JSON strict, avec les clés suivantes :",
    "global_comment: string",
    "grade: number (sur 20, entier)",
    "inline_comments: array d'objets { start: number, end: number, tag: 'ok'|'error'|'detail'|'source', note: string }",
    "start/end sont des index du texte d'entrée (0-based, end exclusif).",
  ].join("\n");

  const user = [
    `Exercice: ${exerciseType}`,
    `Matière: ${course}`,
    `Sujet: ${subject}`,
    `Texte de l'étudiant ci-dessous entre <copie>:</copie>`,
    "<copie>",
    text,
    "</copie>",
  ].join("\n");

  try {
    // 5) Appel modèle
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    });

    const content = resp.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(content);

    // 6) (Optionnel) Sauvegarder la correction en base
    //    Adapte le nom de table/colonnes si tu stockes le résultat.
    // try {
    //   const sb = supabaseAdmin();
    //   if (sb) {
    //     await sb.from("corrections").insert({
    //       submission_id: submissionId,
    //       result_json: result,
    //     });
    //   }
    // } catch (e) {
    //   console.error("Sauvegarde correction échouée:", e);
    // }

    return NextResponse.json(
      { submissionId: submissionId ?? null, result },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("OpenAI error:", err?.message || err);
    return NextResponse.json(
      {
        error: "Erreur pendant la génération de la correction",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
