// app/api/corrections/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Validation d'entrée ---
const Payload = z.object({
  exerciseType: z.enum(["dissertation", "commentaire", "cas", "fiche"]),
  subject: z.string().min(3, "Sujet trop court"),
  course: z.string().min(2, "Matière requise"),
  submissionId: z.string().optional(),
  text: z.string().min(50, "Texte trop court pour une correction utile"),
});

export async function POST(req: NextRequest) {
  // 1) Lire & valider
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { exerciseType, subject, course, text, submissionId } = parsed.data;

  // 2) Sécurité: clé OpenAI uniquement au RUN (pas au build)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Ne pas throw ici => on renvoie une 500 lisible (et le build passe)
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY manquante. Ajoute la variable d’environnement sur Vercel (Project → Settings → Environment Variables) puis redeploie.",
      },
      { status: 500 }
    );
  }

  // 3) Instancier le client à l’intérieur du handler (safe pour le build)
  const openai = new OpenAI({ apiKey });

  // 4) Prompt minimal (tu affinera ensuite avec ta base méthodo)
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
    "Texte de l'étudiant ci-dessous entre <copie>:</copie>",
    "<copie>",
    text,
    "</copie>",
  ].join("\n");

  try {
    // 5) Appel modèle (tu peux passer sur un modèle plus grand si besoin)
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" }, // force JSON
    });

    const content = resp.choices[0]?.message?.content ?? "{}";

    // Option: tu pourras ici sauvegarder en base (corrections) si tu veux
    // en utilisant un client Supabase service-side.

    return NextResponse.json(
      {
        submissionId: submissionId ?? null,
        result: JSON.parse(content),
      },
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
