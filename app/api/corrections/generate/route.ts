// app/api/corrections/generate/route.ts - Version stable temporaire
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("API generate appelée - version stable");
  
  try {
    const body = await req.json();
    const { submissionId } = body;
    
    console.log("SubmissionId reçu:", submissionId);
    
    // Pour l'instant, retourne juste un succès pour arrêter le clignotement
    return NextResponse.json({ 
      ok: true, 
      status: "temporary_fix",
      message: "API stable - diagnostics en cours" 
    });
    
  } catch (error: any) {
    console.log("Erreur generate:", error.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
