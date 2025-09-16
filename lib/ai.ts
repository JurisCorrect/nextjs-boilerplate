// lib/ai.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export type InlineNoteTag = "green" | "red" | "orange" | "blue";

export type CorrectionJSON = {
  score: { overall: number; out_of: number };
  global_comment: string; // commentaire final pro & synthétique
  inline: Array<{
    quote: string;         // court extrait exact de l'élève (ou passage ciblé)
    tag: InlineNoteTag;    // "green" (bien) | "red" (faux) | "orange" (à détailler) | "blue" (sources à ajouter)
    comment: string;       // annotation professorale
  }>;
  html?: string;           // (optionnel) rendu HTML annoté (si généré)
};

export async function generateDissertationCorrection(opts: {
  course: string;
  subject: string;
  content: string;      // copie élève (texte brut)
  methodology: string;  // ta méthodo (résumé – voir plus bas)
}) {
  const { course, subject, content, methodology } = opts;

  const system = `
Tu es "JurisCorrect", correcteur universitaire en droit. 
Règles :
- Tu NE fais PAS l'exercice à la place de l'élève ; tu CORRIGES.
- Tu suis strictement la méthodologie donnée (ci-dessous) et les attentes universitaires.
- Tu écris dans un style professorial : exigeant, précis, bienveillant mais sans flatterie.
- Tutoiement INTERDIT dans la correction : tu vouvoies l’élève.
- Pas d’émojis.
- Tu pointes syntaxe/rigueur/ponctuation si nécessaire.
- Tu peux signaler des pistes de jurisprudence/texte MAIS seulement si pertinentes.

Sortie : un JSON valide exactement selon le schéma demandé (pas de prose hors JSON).
  `.trim();

  const user = `
Matière : ${course}
Sujet   : ${subject}

Méthodologie (résumé à suivre) :
--------------------------------
${methodology}

Copie de l'étudiant :
---------------------
${content}

Attendu — JSON strict :
{
  "score": { "overall": <nombre>, "out_of": 20 },
  "global_comment": "<commentaire global professoral>",
  "inline": [
    {
      "quote": "<court extrait exact ou passage ciblé>",
      "tag": "green|red|orange|blue",
      "comment": "<annotation précise et utile>"
    }
  ]
}
`.trim();

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini", // rapide/éco ; remplace par ton modèle préféré si besoin
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" }, // force un JSON propre
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text) as CorrectionJSON;
  return parsed;
}
