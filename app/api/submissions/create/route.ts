// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[create] POST request received");
    
    const supabase = getSupabaseServer();
    const body = await req.json().catch(() => ({}));
    
    // Extraction des données du payload
    const exerciseKind = body?.payload?.exercise_kind || "cas-pratique";
    const matiere = body?.payload?.matiere || "";
    const sujet = body?.payload?.sujet || body?.text || "";
    const copie = `Document: ${body?.payload?.filename || "document.docx"}`;
    
    const submissionId = crypto.randomUUID();

    console.log("[create] Inserting with correct columns");

    // INSERT avec les vraies colonnes de votre table
    const { error: insErr, data: insertResult } = await supabase
      .from("submissions")
      .insert([{ 
        id: submissionId,
        exercise_kind: exerciseKind,
        matiere: matiere,
        sujet: sujet,
        copie: copie
      }])
      .select();

    console.log("[create] Insert result:", insertResult);

    if (insErr) {
      console.log("[create] Insert error:", insErr.message);
      return NextResponse.json({ 
        error: "insert_failed", 
        details: insErr.message 
      }, { status: 500 });
    }

    console.log("[create] Submission created successfully:", submissionId);

    // Lance la génération
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    
    console.log("[create] Calling generate API");
    
    fetch(`${base}/api/corrections/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        submissionId, 
        payload: { 
          text: `SUJET: ${sujet}\n\nCOPIE: ${copie}`,
          exercise_kind: exerciseKind,
          matiere: matiere
        }
      }),
    }).catch(e => console.log("[create] Generate call failed:", e.message));

    console.log("[create] Returning submissionId:", submissionId);
    return NextResponse.json({ submissionId });

  } catch (e: any) {
    console.log("[create] Exception:", e.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
