// app/api/corrections/generate/route.ts
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  console.log("🚀 [GENERATE] Début génération");
  
  try {
    const { submissionId } = await request.json();
    console.log("📋 [GENERATE] submissionId:", submissionId);

    // Vérification des variables d'environnement
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("❌ [GENERATE] NEXT_PUBLIC_SUPABASE_URL manquant");
      throw new Error("Configuration Supabase manquante");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ [GENERATE] SUPABASE_SERVICE_ROLE_KEY manquant");
      throw new Error("Clé service Supabase manquante");
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ [GENERATE] OPENAI_API_KEY manquant");
      throw new Error("Clé OpenAI manquante");
    }
    console.log("✅ [GENERATE] Variables d'environnement OK");

    // 1. Récupérer la soumission
    console.log("🔍 [GENERATE] Recherche soumission...");
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("content")
      .eq("id", submissionId)
      .single();

    if (fetchError) {
      console.error("❌ [GENERATE] Erreur fetch soumission:", fetchError.message);
      throw new Error(`Erreur récupération: ${fetchError.message}`);
    }

    if (!submission?.content) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    console.log("✅ [GENERATE] Contenu récupéré:", submission.content.length, "caractères");

    // 2. Supprimer toute correction existante
    await supabase.from("corrections").delete().eq("submission_id", submissionId);
    console.log("🔄 [GENERATE] Anciennes corrections supprimées");

    // 3. Créer correction en cours
    const { data: correction } = await supabase
      .from("corrections")
      .insert({ 
        submission_id: submissionId, 
        status: "running" 
      })
      .select("id")
      .single();

    console.log("⏳ [GENERATE] Correction créée, ID:", correction?.id);

    // 4. Appel OpenAI simplifié avec timeout court
    console.log("🤖 [GENERATE] Appel OpenAI...");
    
    const prompt = `Tu es Marie Terki, correctrice experte en droit. Analyse cette copie et retourne EXACTEMENT ce JSON :

{
  "normalizedBody": "Le texte complet reformaté",
  "globalComment": "Votre commentaire global avec vouvoiement strict",
  "inline": [
    {"tag": "red", "quote": "extrait problématique", "comment": "Votre commentaire"},
    {"tag": "orange", "quote": "à améliorer", "comment": "Votre suggestion"},
    {"tag": "blue", "quote": "autre point", "comment": "Votre conseil"}
  ]
}

Règles:
- Au moins 15 commentaires inline
- Vouvoiement obligatoire  
- Tags: red (erreur), orange (améliorer), blue (conseil), green (bien)

Copie à corriger:
${submission.content.slice(0, 12000)}`;

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 3000,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 45000)
      )
    ]) as any;

    console.log("✅ [GENERATE] OpenAI terminé");

    const content = completion.choices?.[0]?.message?.content || "{}";
    let result;
    
    try {
      result = JSON.parse(content);
      console.log("✅ [GENERATE] JSON parsé, commentaires:", result.inline?.length || 0);
    } catch {
      console.log("❌ [GENERATE] JSON invalide, création fallback");
      result = {
        normalizedBody: submission.content,
        globalComment: "Votre correction a été générée. Analyse méthodologique en cours.",
        inline: [
          {tag: "red", quote: submission.content.slice(0, 100), comment: "Point à revoir selon la méthodologie Marie Terki"},
          {tag: "orange", quote: submission.content.slice(200, 300), comment: "Amélioration suggérée"},
          {tag: "blue", quote: submission.content.slice(400, 500), comment: "Conseil méthodologique"}
        ]
      };
    }

    // 5. Sauvegarder
    const { error: updateError } = await supabase
      .from("corrections")
      .update({
        status: "ready",
        result_json: result,
      })
      .eq("id", correction?.id);

    if (updateError) {
      console.error("❌ [GENERATE] Erreur sauvegarde:", updateError.message);
    } else {
      console.log("✅ [GENERATE] Correction sauvegardée avec succès");
    }

    return NextResponse.json({ 
      ok: true, 
      correctionId: correction?.id,
      commentsCount: result.inline?.length || 0
    });

  } catch (error: any) {
    console.error("💥 [GENERATE] Erreur:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
