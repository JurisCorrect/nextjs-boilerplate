// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    // optionnel: récupérer le contenu soumis
    const body = await req.json().catch(() => ({}));
    const payload = body?.payload ?? null;

    const submissionId = crypto.randomUUID();

    // n’insère que des colonnes sûres (évite les erreurs de schéma)
    const { error: insErr } = await supabase
      .from("submissions")
      .insert([{ id: submissionId, user_id: auth.user.id }]);

    if (insErr) {
      console.log("insert submission error:", insErr.message);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    // lancer la génération pour l’aperçu gratuit (fire & forget)
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "https://" + process.env.VERCEL_URL}/api/corrections/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, payload }),
    }).catch(() => {});

    return NextResponse.json({ submissionId }, { status: 200 });
  } catch (e: any) {
    console.log("create submission exception:", e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
