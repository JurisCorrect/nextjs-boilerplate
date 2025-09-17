import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[create] POST request received");

    const supabase = getSupabaseServer();
    const body = await req.json().catch(() => ({}));

    // Champs réels table submissions: id, created, exercise_kind, matiere, sujet, copie
    const exerciseKind = body?.payload?.exercise_kind || "cas-pratique";
    const matiere = body?.payload?.matiere || "";
    const sujet = body?.payload?.sujet || body?.text || "(sujet manquant)";
    const copie = `Document: ${body?.payload?.filename || "document.docx"}`;

    const submissionId = crypto.randomUUID();

    console.log("[create] inserting submission", {
      id: submissionId, exerciseKind, matiere, sujet, copie,
    });

    const { error: insErr } = await supabase
      .from("submissions")
      .insert([{ 
        id: submissionId,
        exercise_kind: exerciseKind,
        matiere,
        sujet,
        copie,
      }]);

    if (insErr) {
      console.log("[create] insert error:", insErr.message);
      return NextResponse.json({ error: "insert_failed", details: insErr.message }, { status: 500 });
    }

    console.log("[create] submission created:", submissionId);

    const base =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000");

    console.log("[create] calling generate:", `${base}/api/corrections/generate`);

    // Appel interne avec await pour capter les erreurs
    try {
      const resp = await fetch(`${base}/api/corrections/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          payload: {
            text: `SUJET: ${sujet}\n\nCOPIE: ${copie}`,
            exercise_kind: exerciseKind,
            matiere,
          },
        }),
      });
      const json = await resp.json().catch(() => ({}));
      console.log("[create] generate status:", resp.status, "body:", json);
    } catch (e: any) {
      console.log("[create] generate fetch failed:", e?.message || e);
    }

    return NextResponse.json({ submissionId });
  } catch (e: any) {
    console.log("[create] exception:", e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
