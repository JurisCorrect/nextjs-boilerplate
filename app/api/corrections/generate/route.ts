// app/api/corrections/generate/route.ts - Test des connexions
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
  console.log("🚀 [GENERATE] Test des connexions");
  
  try {
    const body = await req.json();
    const { submissionId } = body;
    
    console.log("📋 [GENERATE] submissionId:", submissionId);
    
    // Test 1: Connexion Supabase
    const supabase = await getSupabaseAdmin();
    console.log("✅ [GENERATE] Supabase OK");
    
    // Test 2: Récupération soumission
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("subject, content, course, type")
      .eq("id", submissionId)
      .single();
    
    if (error || !submission) {
      console.log("❌ [GENERATE] Soumission non trouvée:", error?.message);
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }
    
    console.log("✅ [GENERATE] Soumission trouvée, taille:", submission.content?.length);
    
    // Test 3: OpenAI (juste vérifier la clé)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log("❌ [GENERATE] Clé OpenAI manquante");
      return NextResponse.json({ error: "openai_key_missing" }, { status: 500 });
    }
    
    console.log("✅ [GENERATE] Clé OpenAI présente");
    
    return NextResponse.json({ 
      ok: true, 
      status: "connections_ok",
      submissionFound: true,
      contentLength: submission.content?.length,
      hasSubject: !!submission.subject
    });
    
  } catch (error: any) {
    console.log("💥 [GENERATE] Erreur:", error.message);
    return NextResponse.json({ error: "test_failed", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
