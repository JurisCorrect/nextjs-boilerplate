// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("=== DEBUG START ===");
    
    // Test 1: API accessible
    console.log("1. API appelée avec succès");
    
    // Test 2: Lecture du body
    const body = await req.json().catch(() => null);
    console.log("2. Body reçu:", body ? "OK" : "VIDE");
    
    // Test 3: Variables d'environnement
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("3. Variables env:", { hasSupabaseUrl, hasSupabaseKey });
    
    // Test 4: Connexion Supabase
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log("4. Client Supabase créé");
    
    // Test 5: Insertion basique
    const submissionId = crypto.randomUUID();
    console.log("5. ID généré:", submissionId);
    
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        id: submissionId,
        exercise_kind: "test",
        copie: "test content"
      })
      .select();
    
    if (error) {
      console.log("6. ERREUR INSERTION:", error);
      return NextResponse.json({ 
        error: "insert_failed", 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }
    
    console.log("6. Insertion réussie:", data);
    console.log("=== DEBUG SUCCESS ===");
    
    return NextResponse.json({ submissionId, success: true });
    
  } catch (e: any) {
    console.log("=== DEBUG ERROR ===", e.message);
    return NextResponse.json({ 
      error: "server_error", 
      message: e.message 
    }, { status: 500 });
  }
}
