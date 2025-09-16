import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server"; // ← ALIAS propre
import { headers } from "next/headers"; // ← pour construire l’URL absolue

// Optionnel mais utile sur Vercel
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SubmissionSchema = z.object({
  subject: z.string().min(3, "Sujet trop court"),
  course: z.string().min(2, "Matière requise"),
  content: z.string().min(30, "Copie trop courte"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_PAYLOAD", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const { subject, course, content } = parsed.data;

    // 1) Insertion dans public.submissions
    const { data, error } = await supabase
      .from("submissions")
      .insert([
        {
          user_id: userId,
          type: "dissertation",
          subject,
          course,
          content,
          status: "received",
        },
      ])
      .select("id")
      .single();

    if (error || !data) {
      console.error("Insert error:", error);
      return NextResponse.json({ ok: false, error: "DB_INSERT_FAILED" }, { status: 500 });
    }

    const submissionId = data.id as string;

    // 2) FIRE & FORGET : lancer la génération côté serveur sans bloquer la réponse
    try {
      const host = headers().get("host")!;
      const isLocal = host?.startsWith("localhost");
      const url = `http${isLocal ? "" : "s"}://${host}/api/corrections/generate`;

      // ⚠️ On n'attend pas la promesse : pas de await ici
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      }).catch(() => {});
    } catch (e) {
      // On log si l'envoi "fire & forget" plante, mais on ne bloque pas l'UI
      console.error("Fire & forget generate error:", e);
    }

    // 3) Réponse immédiate à l'UI
    return NextResponse.json({ ok: true, submissionId }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
