// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[create] 🚀 POST request received"); // LOG DE DÉBUT
    
    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      console.log("[create] ❌ unauthenticated user");
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const text: string | null =
      body?.text ?? body?.payload?.text ?? body?.content ?? body?.body ?? null;
    
    console.log("[create] 📝 Text received, length:", text?.length || 0); // LOG TEXTE

    const submissionId = crypto.randomUUID();

    // IMPORTANT: Stocker le texte dans la base de données
    const { error: insErr } = await supabase
      .from("submissions")
      .insert([{ 
        id: submissionId, 
        user_id: auth.user.id,
        text: text, // AJOUT DU TEXTE ICI
        paid: false 
      }]);

    if (insErr) {
      console.log("[create] ❌ insert error:", insErr.message);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    console.log("[create] ✅ submission created:", submissionId);

    // URL de base pour l'appel interne
    const base = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
    
    console.log("[create] 🔗 calling generate with base URL:", base);

    // Lance la génération (avec await pour capturer les erreurs)
    try {
      const generateResponse = await fetch(`${base}/api/corrections/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          // Ajout d'un header pour identifier les appels internes
          "x-internal-call": "submissions-create" 
        },
        body: JSON.stringify({ 
          submissionId, 
          payload: text ? { text } : null 
        }),
      });

      const generateResult = await generateResponse.json();
      console.log("[create] 📡 generate response status:", generateResponse.status);
      console.log("[create] 📡 generate result:", generateResult);
      
      if (!generateResponse.ok) {
        console.log("[create] ⚠️ generate request failed but continuing");
      }
    } catch (fetchError: any) {
      console.log("[create] ❌ fetch to generate failed:", fetchError.message);
      // On continue quand même, l'utilisateur peut réessayer
    }

    console.log("[create] ✅ returning submissionId:", submissionId);
    return NextResponse.json({ submissionId }, { status: 200 });

  } catch (e: any) {
    console.log("[create] ❌ fatal exception:", e?.message || e);
    console.log("[create] ❌ stack trace:", e?.stack);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
