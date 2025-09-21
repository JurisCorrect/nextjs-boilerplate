// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// URL absolue fiable pour les appels internes
function baseUrl() {
  return (
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
    "http://localhost:3000"
  );
}

// Client Supabase admin (bypass RLS pour insert)
async function getAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  try {
    console.log("[create] 🚀 POST");

    const supabase = await getAdmin();

    const ctype = req.headers.get("content-type") || "";
    const isMultipart = ctype.includes("multipart/form-data");

    // Champs finaux
    let exerciseKind = "cas-pratique";
    let matiere = "";
    let sujet = "";
    let filename = "document.docx";
    let joinedText = ""; // => envoyé à /api/corrections/generate (payload.text)

    if (isMultipart) {
      // ============= FORM-DATA (cas pratique / dissertation) =============
      const form = await req.formData();

      // "mode" posé côté client : "cas-pratique" ici
      exerciseKind = String(form.get("mode") || "cas-pratique");
      sujet = String(form.get("sujet") || "");

      const file = form.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "missing_file" }, { status: 400 });
      }

      filename = file.name || "document.docx";

      // Lecture du .docx côté serveur
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // mammoth (Node)
      const mammoth = await import("mammoth");
      const { value: docText = "" } = await mammoth.extractRawText({ buffer });

      // ✅ Texte propre : sujet + doc, sans labels "ÉNONCÉ" / "COPIE"
      joinedText = [sujet.trim(), (docText || "").trim()].filter(Boolean).join("\n\n");
    } else {
      // ============= JSON (compat anciennes pages) =============
      const body = await req.json().catch(() => ({} as any));
      exerciseKind = body?.payload?.exercise_kind || body?.exercise_kind || "cas-pratique";
      matiere = body?.payload?.matiere || body?.matiere || "";
      sujet = body?.payload?.sujet || body?.text || body?.sujet || "";
      filename = body?.payload?.filename || body?.filename || "document.docx";
      const payloadText = body?.payload?.text || body?.text || "";

      // ✅ Pas de labels non plus dans le fallback JSON
      joinedText = String(payloadText || sujet || "");
    }

    console.log("[create] 📄 Contenu extrait:", joinedText.length, "caractères");

    // INSERT minimal conforme à ton schéma - CORRECTION ICI
    const submissionId = crypto.randomUUID();
    const { error: insErr } = await supabase
      .from("submissions")
      .insert([{
        id: submissionId,
        exercise_kind: exerciseKind,
        matiere,
        sujet,
        copie: joinedText, // CORRECTION: on stocke le contenu extrait, pas le filename
      }]);

    if (insErr) {
      console.log("[create] ❌ insert error:", insErr.message);
      return NextResponse.json({ error: "insert_failed", details: insErr.message }, { status: 500 });
    }

    console.log("[create] ✅ submission:", submissionId, "avec", joinedText.length, "caractères sauvegardés");

    // Appel interne vers la génération (payload.text = joinedText)
    const base = baseUrl();
    try {
      const r = await fetch(`${base}/api/corrections/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          payload: {
            text: joinedText,
            exercise_kind: exerciseKind,
            matiere,
            sujet,
          },
        }),
      });
      const j = await r.json().catch(() => ({}));
      console.log("[create] ↩ generate:", r.status, j?.status || j?.error || "ok");
    } catch (e: any) {
      // Ce n'est pas bloquant : la page /correction/[id] pollera "running"
      console.log("[create] ⚠ generate call failed:", e?.message || e);
    }

    return NextResponse.json({ submissionId }, { status: 200 });
  } catch (e: any) {
    console.log("[create] ❌ fatal:", e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
