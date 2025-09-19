// app/api/corrections/generate/route.ts - Diagnostic complet des variables d'environnement
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getSupabaseAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  console.log("🔍 [GENERATE] Diagnostic variables environnement");
  
  try {
    const body = await req.json();
    const { submissionId } = body;
    
    console.log("📋 [GENERATE] submissionId:", submissionId);
    
    // Test 1: Diagnostic variables d'environnement
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("🔑 Diagnostic OpenAI:");
    console.log("- Clé présente:", !!apiKey);
    console.log("- Longueur clé:", apiKey?.length || 0);
    console.log("- Commence par sk-:", apiKey?.startsWith('sk-') || false);
    console.log("- Première partie:", apiKey?.substring(0, 10) || 'vide');
    
    // Liste toutes les variables qui commencent par OPENAI
    console.log("🔍 Variables OPENAI disponibles:");
    Object.keys(process.env).forEach(key => {
      if (key.includes('OPENAI')) {
        console.log(`- ${key}:`, !!process.env[key], `(${process.env[key]?.length || 0} chars)`);
      }
    });
    
    if (!apiKey) {
      console.log("❌ [GENERATE] Clé OpenAI manquante - arrêt du processus");
      return NextResponse.json({ 
        error: "openai_key_missing",
        debug: {
          hasKey: false,
          envVars: Object.keys(process.env).filter(k => k.includes('OPENAI'))
        }
      }, { status: 500 });
    }
    
    console.log("✅ [GENERATE] Clé OpenAI OK");
    
    // Test 2: Supabase
    const supabase = await getSupabaseAdmin();
    console.log("✅ [GENERATE] Supabase OK");
    
    // Test 3: Récupération soumission
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("sujet, copie, matiere, exercise_kind")
      .eq("id", submissionId)
      .single();
    
    if (error || !submission) {
      console.log("❌ [GENERATE] Soumission non trouvée:", error?.message);
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }
    
    console.log("✅ [GENERATE] Soumission trouvée:");
    console.log("- Sujet:", submission.sujet?.substring(0, 50) + "...");
    console.log("- Matière:", submission.matiere);  
    console.log("- Exercise:", submission.exercise_kind);
    console.log("- Taille copie:", submission.copie?.length);
    
    // Test 4: Validation des données
    if (!submission.sujet || !submission.copie) {
      console.log("❌ [GENERATE] Données manquantes:", {
        hasSubject: !!submission.sujet,
        hasContent: !!submission.copie
      });
      return NextResponse.json({ 
        error: "missing_data",
        details: "Sujet ou copie manquant"
      }, { status: 400 });
    }
    
    console.log("✅ [GENERATE] Toutes les vérifications OK - prêt pour OpenAI");
    
    return NextResponse.json({ 
      ok: true, 
      status: "all_checks_passed",
      data: {
        hasSubject: !!submission.sujet,
        hasContent: !!submission.copie,
        exerciseType: submission.exercise_kind,
        matiere: submission.matiere,
        contentLength: submission.copie?.length,
        subjectPreview: submission.sujet?.substring(0, 100)
      }
    });
    
  } catch (error: any) {
    console.log("💥 [GENERATE] Erreur générale:", error.message);
    console.log("Stack trace:", error.stack);
    return NextResponse.json({ 
      error: "diagnostic_failed", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
