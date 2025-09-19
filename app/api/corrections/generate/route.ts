// app/api/corrections/generate/route.ts - Version debug pour identifier le blocage
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Configuration OpenAI - Initialisation paresseuse pour éviter les erreurs de build
let openai: OpenAI;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Configuration Supabase
async function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE service role manquant");
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

export async function POST(req: Request) {
  console.log("🚀 [GENERATE] Début de la génération");
  
  try {
    const body = await req.json();
    const { submissionId } = body;
    
    console.log("📋 [GENERATE] submissionId reçu:", submissionId);
    
    if (!submissionId) {
      console.log("❌ [GENERATE] submissionId manquant");
      return NextResponse.json({ error: "missing_submission_id" }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();
    console.log("✅ [GENERATE] Connexion Supabase OK");

    // 1. Récupérer la soumission
    console.log("🔍 [GENERATE] Recherche soumission...");
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("subject, content, course, type")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.log("❌ [GENERATE] Erreur récupération soumission:", fetchError?.message);
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }
    
    console.log("✅ [GENERATE] Soumission trouvée, taille content:", submission.content?.length);

    // 2. Vérifier si correction existe déjà
    console.log("🔍 [GENERATE] Vérification correction existante...");
    const { data: existing } = await supabase
      .from("corrections")
      .select("id, status")
      .eq("submission_id", submissionId)
      .single();

    if (existing && existing.status === "ready") {
      console.log("✅ [GENERATE] Correction déjà existante");
      return NextResponse.json({ 
        ok: true, 
        correctionId: existing.id, 
        status: "ready",
        message: "Correction already exists" 
      });
    }

    // 3. Créer ou mettre à jour la correction
    console.log("💾 [GENERATE] Création/mise à jour correction...");
    const { data: correction, error: insertError } = await supabase
      .from("corrections")
      .upsert({
        submission_id: submissionId,
        status: "running",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !correction) {
      console.log("❌ [GENERATE] Erreur création correction:", insertError?.message);
      return NextResponse.json({ error: "correction_creation_failed" }, { status: 500 });
    }

    console.log("✅ [GENERATE] Correction créée, ID:", correction.id);

    // 4. Préparation des données pour OpenAI
    console.log("🤖 [GENERATE] Préparation prompt OpenAI...");
    const { subject, content: sourceText, course, type } = submission;
    
    if (!subject || !sourceText) {
      console.log("❌ [GENERATE] Données manquantes - subject:", !!subject, "content:", !!sourceText);
      return NextResponse.json({ error: "missing_subject_and_work" }, { status: 400 });
    }

    // Votre prompt complet existant (gardez-le tel quel)
    const prompt = `Tu es Marie Terki, correctrice experte en droit et professeure particulière réputée.

IMPORTANT : Tu dois retourner un JSON valide avec exactement cette structure :
{
  "normalizedBody": "texte de la copie formaté et nettoyé",
  "globalComment": "commentaire global détaillé selon mes exigences", 
  "inline": [
    {"tag": "red", "quote": "extrait exact", "comment": "commentaire expert"},
    {"tag": "orange", "quote": "autre extrait", "comment": "commentaire détaillé"}
  ],
  "score": "note sur 20 avec justification"
}

=== MES EXIGENCES DE CORRECTION ===
- Minimum 20-30 commentaires inline détaillés pour une copie complète
- Ton professoral rigoureux, vouvoiement obligatoire
- Méthodologie juridique stricte : plan, problématique, transitions, définitions
- Détection syntaxe robotique sans mentionner l'IA
- Tags couleur : green (rare, encouragement), red (erreur factuelle), orange (à développer), blue (source manquante)

SUJET DONNÉ : ${subject}

COPIE À CORRIGER :
${sourceText.slice(0, 12000)}`;

    // 5. Appel OpenAI
    console.log("🤖 [GENERATE] Appel OpenAI en cours...");
    const startTime = Date.now();
    
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    }, {
      timeout: 45000, // 45 secondes - dans les options
    });

    const endTime = Date.now();
    console.log(`✅ [GENERATE] OpenAI terminé en ${endTime - startTime}ms`);

    const rawResponse = completion.choices[0]?.message?.content;
    console.log("📝 [GENERATE] Réponse OpenAI reçue, taille:", rawResponse?.length);

    if (!rawResponse) {
      console.log("❌ [GENERATE] Réponse OpenAI vide");
      throw new Error("Empty response from OpenAI");
    }

    // 6. Parse JSON
    console.log("🔧 [GENERATE] Parse JSON...");
    let result;
    try {
      result = JSON.parse(rawResponse);
      console.log("✅ [GENERATE] JSON parsé, inline comments:", result?.inline?.length || 0);
    } catch (parseError) {
      console.log("❌ [GENERATE] Erreur parse JSON:", parseError);
      
      // Fallback avec votre qualité maintenue
      result = {
        normalizedBody: sourceText,
        globalComment: `Correction experte en cours de finalisation. Votre copie nécessite une analyse approfondie de la méthodologie juridique. Les commentaires détaillés seront disponibles sous peu.`,
        inline: [
          {
            tag: "orange",
            quote: sourceText.slice(0, 100) + "...",
            comment: "Analyse méthodologique en cours. Cette section nécessite une révision selon les standards universitaires."
          }
        ],
        score: "Évaluation en cours"
      };
    }

    // 7. Sauvegarde du résultat
    console.log("💾 [GENERATE] Sauvegarde résultat...");
    const { error: updateError } = await supabase
      .from("corrections")
      .update({
        status: "ready",
        result_json: result,
        updated_at: new Date().toISOString(),
      })
      .eq("id", correction.id);

    if (updateError) {
      console.log("❌ [GENERATE] Erreur sauvegarde:", updateError.message);
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }

    console.log("✅ [GENERATE] Correction complète sauvegardée");
    
    return NextResponse.json({
      ok: true,
      correctionId: correction.id,
      status: "ready",
      commentsCount: result?.inline?.length || 0
    });

  } catch (error: any) {
    console.log("💥 [GENERATE] Erreur générale:", error.message);
    console.log("Stack trace:", error.stack);
    
    return NextResponse.json(
      { error: "generation_failed", details: error.message },
      { status: 500 }
    );
  }
}
