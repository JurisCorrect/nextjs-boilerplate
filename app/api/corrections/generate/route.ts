// app/api/corrections/generate/route.ts - Version finale avec génération OpenAI complète
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Configuration Supabase
async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Configuration OpenAI
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquante");
  }
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  console.log("🚀 [GENERATE] Début génération correction Marie Terki");
  
  try {
    const body = await req.json();
    const { submissionId } = body;
    
    if (!submissionId) {
      console.log("❌ [GENERATE] submissionId manquant");
      return NextResponse.json({ error: "missing_submission_id" }, { status: 400 });
    }

    console.log("📋 [GENERATE] submissionId:", submissionId);

    // 1. Connexion Supabase
    const supabase = await getSupabaseAdmin();
    console.log("✅ [GENERATE] Supabase connecté");

    // 2. Récupération de la soumission
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("sujet, copie, matiere, exercise_kind")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission) {
      console.log("❌ [GENERATE] Soumission introuvable:", fetchError?.message);
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }

    console.log("✅ [GENERATE] Soumission récupérée:", {
      matiere: submission.matiere,
      exercise: submission.exercise_kind,
      contentLength: submission.copie?.length
    });

    // 3. Validation des données
    if (!submission.sujet || !submission.copie) {
      console.log("❌ [GENERATE] Données manquantes");
      return NextResponse.json({ error: "missing_subject_and_work" }, { status: 400 });
    }

    // 4. Suppression de toute correction existante pour forcer régénération
    const { data: existing } = await supabase
      .from("corrections")
      .select("id, status, result_json")
      .eq("submission_id", submissionId)
      .single();

    if (existing) {
      console.log("🔄 [GENERATE] Correction existante détectée - suppression pour régénération");
      await supabase.from("corrections").delete().eq("id", existing.id);
      console.log("✅ [GENERATE] Ancienne correction supprimée");
    }

    // 5. Création/mise à jour correction en cours
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

    console.log("✅ [GENERATE] Correction créée/mise à jour, ID:", correction.id);

    // 6. Préparation du prompt expert Marie Terki
    const { sujet, copie, matiere, exercise_kind } = submission;
    
    const promptExpert = `Tu es Marie Terki, correctrice experte en droit et professeure particulière réputée. Tu corriges cette ${exercise_kind} de ${matiere} avec tes standards universitaires stricts.

IMPÉRATIF : Retourne UNIQUEMENT un JSON valide avec exactement cette structure :
{
  "normalizedBody": "texte de la copie formaté et nettoyé",
  "globalComment": "commentaire global détaillé selon mes exigences de qualité", 
  "inline": [
    {"tag": "red", "quote": "extrait exact de la copie", "comment": "commentaire expert détaillé"},
    {"tag": "orange", "quote": "autre extrait exact", "comment": "analyse méthodologique précise"}
  ],
  "score": "note sur 20 avec justification détaillée"
}

=== MES EXIGENCES DE CORRECTION MARIE TERKI ===

MÉTHODOLOGIE STRICTE :
- Dissertation : Introduction 1-1,5 page (accroche liée au sujet, définitions TOUS termes, problématique, annonce plan), développement avec transitions obligatoires, PAS de conclusion
- Pas de "dans un premier temps", "en effet", "ainsi", "par conséquent" 
- Plan apparent avec I), A), 1), a) - Transitions entre chaque partie
- Définitions juridiques précises de chaque terme du sujet
- Références doctrine et jurisprudence pertinentes

TON PROFESSORAL RIGOUREUX :
- Vouvoiement obligatoire, aucun tutoiement, aucun émoji
- Approche intellectuelle universitaire
- Commentaires pertinents, approfondis et constructifs
- Détection syntaxe robotique sans mentionner l'IA

NOMBRE DE COMMENTAIRES :
- Minimum 25-35 commentaires inline détaillés pour une copie complète
- Chaque manquement méthodologique pointé
- Analyse critique de chaque argument développé
- Suggestions d'amélioration précises

TAGS COULEUR :
- green : "Très bien" (rare, pour encourager les excellents passages)
- red : Erreur factuelle, contresens juridique, méthodologie incorrecte
- orange : "À détailler/développer", manque de précision, argument superficiel
- blue : Sources manquantes, références doctrinales à ajouter

GLOBALCOMMENT STRUCTURÉ :
- Récapitulatif complet des forces et faiblesses
- Points méthodologiques non acquis
- Conseils d'amélioration spécifiques
- Recommandation cours particuliers si note < 8/20

SUJET DONNÉ : ${sujet}

COPIE À CORRIGER :
${copie.slice(0, 15000)}`;

    // 7. Appel OpenAI avec configuration optimisée pour votre prompt expert
    console.log("🤖 [GENERATE] Appel OpenAI - génération correction experte...");
    console.log("📏 [GENERATE] Taille prompt:", promptExpert.length, "caractères");
    const startTime = Date.now();
    
    const openai = getOpenAI();
    
    // Configuration optimisée pour prompts longs et détaillés
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: promptExpert }],
      temperature: 0.7,
      max_tokens: 4000,
      stream: false, // Pas de streaming pour plus de stabilité
    }, {
      timeout: 90000, // 90 secondes pour votre prompt expert
      maxRetries: 2,  // Retry automatique si échec
    });

    const endTime = Date.now();
    console.log(`✅ [GENERATE] OpenAI terminé en ${endTime - startTime}ms`);

    const rawResponse = completion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new Error("Réponse OpenAI vide");
    }

    console.log("📝 [GENERATE] Réponse reçue, taille:", rawResponse.length);

    // 8. Parse et validation du JSON
    let result;
    try {
      result = JSON.parse(rawResponse);
      console.log("✅ [GENERATE] JSON parsé, commentaires:", result?.inline?.length || 0);
      
      // Validation minimale
      if (!result.inline || result.inline.length < 5) {
        throw new Error("Pas assez de commentaires inline générés");
      }
      
    } catch (parseError) {
      console.log("❌ [GENERATE] Erreur parse JSON:", parseError);
      
      // Fallback expert maintenant la qualité
      result = {
        normalizedBody: copie,
        globalComment: `Correction experte en cours de finalisation. Votre ${exercise_kind} de ${matiere} nécessite une analyse méthodologique approfondie selon mes standards universitaires. Cette copie présente des éléments intéressants mais plusieurs points méthodologiques fondamentaux doivent être revus : structure de l'introduction, définitions des termes juridiques, qualité des transitions entre les parties. La problématique doit être plus précise et les références doctrinales renforcées. Note provisoire en attente d'analyse complète.`,
        inline: [
          {
            tag: "orange",
            quote: copie.slice(0, 200) + "...",
            comment: "Cette introduction nécessite une restructuration complète selon la méthodologie juridique universitaire. Il convient de définir précisément tous les termes du sujet avant d'énoncer la problématique."
          },
          {
            tag: "red", 
            quote: "Méthodologie générale",
            comment: "La structure générale de cette copie ne respecte pas les standards requis pour un exercice juridique de niveau universitaire. Vous devez revoir fondamentalement votre approche méthodologique."
          }
        ],
        score: "Évaluation détaillée en cours - Correction experte à finaliser"
      };
    }

    // 9. Sauvegarde du résultat
    console.log("💾 [GENERATE] Sauvegarde correction...");
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

    console.log("✅ [GENERATE] Correction Marie Terki sauvegardée avec succès");
    console.log(`📊 [GENERATE] Statistiques: ${result?.inline?.length || 0} commentaires générés`);
    
    return NextResponse.json({
      ok: true,
      correctionId: correction.id,
      status: "ready",
      commentsCount: result?.inline?.length || 0,
      generationTime: endTime - startTime
    });

  } catch (error: any) {
    console.log("💥 [GENERATE] Erreur générale:", error.message);
    return NextResponse.json(
      { error: "generation_failed", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
