// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("=== API DEBUG START ===");
  
  try {
    // Test simple sans Supabase d'abord
    console.log("1. API accessible");
    
    const submissionId = "test_" + Date.now();
    console.log("2. ID généré:", submissionId);
    
    return NextResponse.json({ 
      submissionId, 
      message: "Test API sans base de données",
      success: true 
    });
    
  } catch (e: any) {
    console.log("=== ERROR ===", e.message);
    return NextResponse.json({ 
      error: e.message 
    }, { status: 500 });
  }
}
