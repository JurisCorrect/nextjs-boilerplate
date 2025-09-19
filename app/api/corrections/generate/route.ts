// app/api/corrections/generate/route.ts - Avec les bonnes colonnes
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
  console.log("🚀 [GENERATE] Test avec bonnes colonnes");
  
  try {
    const body = await req.json();
    const { submissionId } = body;
    
    console.log("📋 [GENERATE] submissionId:", submissionId);
    
    // Test avec les vraies colonnes
    const supabase = await getSupabaseAdmin();
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("sujet, copie, matiere, exercise_kind")  // ✅ Bonnes colonnes
      .eq("id", submissionId)
      .single();
    
    if (error || !submission) {
      console.log("❌ [GENERATE] Soumission non trouvée:", error?.message);
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }
    
    console.log("✅ [GENERATE] Soumission trouvée:");
    console.log("- Sujet:", submission.sujet);
    console.log("- Matière:", submission.matiere);  
    console.log("- Exercise:", submission.exercise_kind);
    console.log("- Taille copie:", submission.copie?.length);
    
    // Test OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log("❌ [GENERATE] Clé OpenAI manquante");
      return NextResponse.json({ error: "openai_key_missing" }, { status: 500 });
    }
    
    console.log("✅ [GENERATE] Tout est OK - prêt pour la génération");
    
    return NextResponse.json({ 
      ok: true, 
      status: "ready_for_generation",
      hasSubject: !!submission.sujet,
      hasContent: !!submission.copie,
      exerciseType: submission.exercise_kind
    });
    
  } catch (error: any) {
    console.log("💥 [GENERATE] Erreur:", error.message);
    return NextResponse.json({ error: "test_failed", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
