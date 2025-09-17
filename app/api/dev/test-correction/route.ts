// app/api/dev/test-correction/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAMPLE_TEXT = `Sujet : La responsabilité administrative pour faute
Introduction — Depuis l'arrêt Blanco, la responsabilité de l'administration...
I. La faute simple demeure le principe...
II. Vers un régime de plus en plus objectif... Conclusion.`

export async function GET(req: Request) {
  const supabase = getSupabaseServer();

  // base URL propre (prod/preview/local)
  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // besoin d'être connecté (pour lier la soumission à un user)
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    // si pas loggé, on renvoie vers login, puis retour ici
    return NextResponse.redirect(`${base}/login?next=/api/dev/test-correction`);
  }

  // 1) crée une submission
  const submissionId = crypto.randomUUID();
  const { error: insErr } = await supabase
    .from("submissions")
    .insert([{ id: submissionId, user_id: auth.user.id }]);
  if (insErr) {
    console.log("[test-correction] insert error:", insErr.message);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  // 2) lance la génération avec un texte de démo
  await fetch(`${base}/api/corrections/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId, payload: { text: SAMPLE_TEXT } }),
  }).catch(() => {});

  // 3) redirige directement vers la page de lecture
  return NextResponse.redirect(`${base}/correction/${submissionId}`);
}
