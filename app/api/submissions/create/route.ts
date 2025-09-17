// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[create] 🚀 POST request received");
    
    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    
    const userId = auth?.user?.id || "anonymous-user";
    console.log("[create] 👤 User ID:", userId);

    const body = await req.json().catch(() => ({}));
    const text: string | null =
      body?.text ?? body?.payload?.text ?? body?.content ?? body?.body ?? null;
    
    console.log("[create] 📝 Text received, length:", text?.length || 0);

    const submissionId = crypto.randomUUID();

    // INSERT MINIMAL - seulement les colonnes qui existent
    const { error: insErr } = await supabase
      .from("submissions")
      .insert([{ 
        id: submissionId, 
        user_id: userId,
        // Suppression de 'text' et 'paid' si elles n'existent pas
      }]);

    if (insErr) {
      console.log("[create] ❌ insert error:", insErr.message);
      return NextResponse.json({ error: "insert_failed", details: insErr.message }, { status: 500 });
    }

    console.log("[create] ✅ submission created:", submissionId);

    // URL de base pour l'appel interne
    const base = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000";
    
    console.log("[create] 🔗 calling generate with base URL:", base);

    // Lance la génération avec le texte passé en payload
    try {
      const generateResponse = await fetch(`${base}/api/corrections/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-call": "submissions-create" 
        },
        body: JSON.stringify({ 
          submissionId, 
          payload: text ? { text } : null 
        }),
      });

      console.log("[create] 📡 generate response status:", generateResponse.status);
      
    } catch (fetchError: any) {
      console.log("[create] ❌ fetch to generate failed:", fetchError.message);
    }

    console.log("[create] ✅ returning submissionId:", submissionId);
    return NextResponse.json({ submissionId }, { status: 200 });

  } catch (e: any) {
    console.log("[create] ❌ fatal exception:", e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
