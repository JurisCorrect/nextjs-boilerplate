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

// Fonction de recherche dans la base de connaissances
async function searchKnowledgeBase(query: string, category?: string) {
  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const supabase = await getSupabaseAdmin();
    
    // Recherche par similarité vectorielle
    const { data: results } = await supabase.rpc('match_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 10 // Plus de résultats pour corrections complètes
    });

    return results || [];
  } catch (error) {
    log('Erreur recherche knowledge base:', error);
    return [];
  }
}

// Détection de la matière juridique
function detectLegalSubject(text: string): string {
  const indicators = {
    'constitutionnel': ['constitution', 'conseil constitutionnel', 'QPC', 'contrôle de constitutionnalité', 'bloc de constitutionnalité'],
    'civil': ['code civil', 'obligation', 'contrat', 'responsabilité civile', 'cassation civile', 'cour de cassation'],
    'penal': ['code pénal', 'infraction', 'crime', 'délit', 'contravention', 'cassation criminelle'],
    'administratif': ['conseil d\'état', 'service public', 'acte administratif', 'recours', 'juridiction administrative'],
    'europeen': ['CJUE', 'CEDH', 'droit européen', 'convention européenne', 'cour de justice']
  };

  const textLower = text.toLowerCase();
  let maxMatches = 0;
  let detectedSubject = 'general';

  for (const [subject, keywords] of Object.entries(indicators)) {
    const matches = keywords.filter(keyword => textLower.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedSubject = subject;
    }
  }

  return detectedSubject;
}

// Détection du type d'exercice
function detectExerciseType(text: string): string {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('cas pratique') || 
      (textLower.includes('jean') && textLower.includes('marie')) ||
      textLower.includes('situation') && textLower.includes('conseil')) {
    return 'cas_pratique';
  }
  
  if (textLower.includes('cour de cassation') || 
      textLower.includes('conseil d\'état') ||
      textLower.includes('arrêt') && textLower.includes('commentaire')) {
    return 'commentaire_arret';
  }
  
  if (textLower.includes('dissertation') ||
      (textLower.includes('?') && text.split(' ').length < 50)) {
    return 'dissertation';
  }
  
  return 'general';
}

// Validation sujet + copie
function validateSubmission(text: string, exerciseType: string): { valid: boolean, error?: string } {
  if (!text || text.trim().length < 100) {
    return { 
      valid: false, 
      error: "Votre devoir est trop court. Vous devez inclure OBLIGATOIREMENT le sujet ET votre réalisation complète." 
    };
  }

  // Vérifications spécifiques par type d'exercice
  if (exerciseType === 'cas_pratique') {
    if (!text.toLowerCase().includes('cas pratique') && 
        !text.includes('situation') && 
        !text.includes('jean') && !text.includes('marie') && !text.includes('pierre')) {
      return { 
        valid: false, 
        error: "Pour un cas pratique, vous devez copier l'énoncé complet du cas puis votre résolution. L'énoncé du cas est indispensable pour une correction fiable." 
      };
    }
  }
  
  if (exerciseType === 'commentaire_arret') {
    if (!text.toLowerCase().includes('arrêt') && 
        !text.includes('cour de cassation') && 
        !text.includes('conseil d\'état')) {
      return { 
        valid: false, 
        error: "Pour un commentaire d'arrêt, vous devez copier l'arrêt intégral puis votre commentaire/fiche d'arrêt. L'arrêt est indispensable pour une correction fiable." 
      };
    }
  }

  if (exerciseType === 'dissertation') {
    if (!text.includes('?') && text.split('\n').length < 10) {
      return { 
        valid: false, 
        error: "Pour une dissertation, vous devez donner le sujet (question posée) puis votre dissertation complète. Le sujet est indispensable pour une correction fiable." 
      };
    }
  }

  return { valid: true };
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
    row.sujet ??
    row.copie ??
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

    const supabase = await getSupabaseAdmin();

    // Vérification idempotence
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

    // Récupération du texte
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .select("id,user_id,text,content,body,essay,input_text,payload,sujet,copie")
      .eq("id", submissionId)
      .maybeSingle();

    if (subErr) log("⚠️ select submissions error:", subErr.message);

    let sourceText = pickSubmissionText(sub) ?? pickSubmissionText({ payload });
    log("📄 Source text length:", sourceText?.length || 0);

    // Création correction "running"
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

    // Validation du contenu
    if (!sourceText || sourceText.length < 50) {
      const placeholder = {
        normalizedBody: "",
        globalComment: "❌ ERREUR : Vous devez obligatoirement fournir le SUJET complet de votre exercice ET votre réalisation. Sans le sujet, une correction fiable est impossible. Recommencez en copiant d'abord l'énoncé/sujet, puis votre travail à la suite.",
        inline: [],
        score: { overall: 0, out_of: 20 },
        error: "missing_subject_and_work",
      };
      
      await supabase
        .from("corrections")
        .update({ status: "ready", result_json: placeholder })
        .eq("id", correctionId);
      
      return NextResponse.json({
        ok: true,
        correctionId,
        status: "ready",
        note: "validation_error",
      });
    }

    // Détection du type d'exercice et de la matière
    const exerciseType = detectExerciseType(sourceText);
    const legalSubject = detectLegalSubject(sourceText);
    
    // Validation sujet + copie
    const validation = validateSubmission(sourceText, exerciseType);
    if (!validation.valid) {
      const errorResult = {
        normalizedBody: sourceText.slice(0, 1000),
        globalComment: `❌ ERREUR DE SOUMISSION : ${validation.error}\n\nRECOMMENCEZ en respectant ce format :\n1. Copiez le sujet/énoncé complet\n2. À la suite, ajoutez votre réalisation\n\nSans le sujet, je ne peux pas vous fournir une correction pertinente.`,
        inline: [],
        score: { overall: 0, out_of: 20 },
        error: "invalid_submission",
      };
      
      await supabase
        .from("corrections")
        .update({ status: "ready", result_json: errorResult })
        .eq("id", correctionId);
      
      return NextResponse.json({
        ok: true,
        correctionId,
        status: "ready",
        note: "validation_failed",
      });
    }

    // Recherche dans la base de connaissances
    log("🔍 Recherche base de connaissances...", { exerciseType, legalSubject });
    const relevantKnowledge = await searchKnowledgeBase(sourceText, legalSubject);
    
    // Construction du contexte enrichi
    const knowledgeContext = relevantKnowledge
      .map((k: any) => `📚 ${k.title}: ${k.content?.slice(0, 800)}...`)
      .join('\n\n');

    // Prompt expert pour correction juridique
    log("🤖 Calling OpenAI API avec contexte enrichi...");
    let resultJson: any = null;
    
    try {
      if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");

      const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000); // Plus de temps pour analyses complexes

      const prompt = `Tu es Marie Terki, experte en droit et correctrice de copies juridiques universitaires. Tu corriges un ${exerciseType === 'cas_pratique' ? 'cas pratique' : exerciseType === 'dissertation' ? 'dissertation' : 'commentaire/fiche d\'arrêt'} en ${legalSubject}.

=== BASE DE CONNAISSANCES JURIDIQUE ===
${knowledgeContext}

=== CONSIGNES DE CORRECTION STRICTES ===
Retourne UNIQUEMENT un JSON avec cette structure EXACTE :
{
  "normalizedBody": "<texte reformatté>",
  "globalComment": "<commentaire global détaillé>",
  "inline": [
    { "tag": "green|red|orange|blue", "quote": "<extrait précis du texte>", "comment": "<commentaire détaillé>" }
  ],
  "score": { "overall": <note>, "out_of": 20 },
  "methodology": "<analyse méthodologique>",
  "exerciseType": "${exerciseType}",
  "legalSubject": "${legalSubject}"
}

EXIGENCES MÉTHODOLOGIQUES ${exerciseType.toUpperCase()} :
${exerciseType === 'dissertation' ? `
- Phrase d'accroche pertinente
- Définition précise des termes du sujet
- Contexte historique/actualité
- Intérêts et enjeux du sujet
- Problématique claire et juridique
- Annonce de plan équilibrée
- Plan en 2 parties, 2 sous-parties chacune
- Transitions entre parties
- Conclusion avec ouverture
` : exerciseType === 'cas_pratique' ? `
- Identification des faits pertinents
- Qualification juridique précise
- Identification des problèmes de droit
- Recherche des règles applicables
- Application du droit aux faits
- Solution motivée et complète
` : `
- Fiche d'arrêt complète (faits, procédure, prétentions, solution)
- Identification des problèmes de droit
- Analyse de la portée de l'arrêt
- Critique constructive de la solution
- Mise en perspective jurisprudentielle
`}

CORRECTION INLINE :
- MINIMUM 20-40 commentaires détaillés (selon longueur du devoir)
- Citations courtes mais précises du texte (max 100 caractères par quote)
- Tags : green (très bien), red (erreur grave), orange (à améliorer), blue (suggestion)
- Commentaires personnalisés et constructifs
- Références à la base de connaissances quand pertinent

COMMENTAIRE GLOBAL OBLIGATOIRE :
1. Points forts identifiés
2. Points faibles majeurs
3. Analyse méthodologique détaillée
4. Conseils d'amélioration précis
5. Si note < 8/20 : recommander contact pour cours particuliers
6. Références juridiques complémentaires suggérées

DÉTECTION PROBLÈMES :
- Si devoir incomplet : expliquer ce qui manque sans faire le devoir
- Si syntaxe robotique : signaler "tournure peu naturelle" sans mentionner IA
- Si méthodologie absente : expliquer la méthode attendue

Texte à corriger (SUJET + RÉALISATION) :
"""${sourceText.slice(0, 15000)}"""`;

      const resp = await openai.chat.completions.create(
        {
          model: "gpt-4o",  // Modèle plus puissant pour corrections complexes
          temperature: 0.2,  // Plus de précision, moins de créativité
          messages: [
            {
              role: "system",
              content: "Tu es Marie Terki, correctrice experte en droit. Tu rends uniquement du JSON valide conforme au schéma demandé avec des corrections détaillées et personnalisées.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" as any },
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);
      const content = resp.choices?.[0]?.message?.content || "";
      resultJson = safeJson(content);
      log("✔️ OpenAI response received with", resultJson?.inline?.length || 0, "comments");
      
    } catch (e: any) {
      log("⚠️ openai error:", e?.message || e);
      // Fallback robuste
      resultJson = {
        normalizedBody: sourceText,
        globalComment: `⚠️ Analyse technique temporairement indisponible. Votre devoir de ${exerciseType} en ${legalSubject} nécessite une correction personnalisée.\n\nPour une correction complète immédiate, contactez Marie Terki pour un cours particulier.\n\n📧 Contact : marie.terki@icloud.com`,
        inline: [
          {
            tag: "orange",
            quote: sourceText.slice(0, 80),
            comment: "Analyse en cours - correction technique temporaire.",
          }
        ],
        score: { overall: null, out_of: 20 },
        methodology: "Analyse méthodologique temporairement indisponible",
        exerciseType,
        legalSubject,
      };
    }

    // Sauvegarde finale
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
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
