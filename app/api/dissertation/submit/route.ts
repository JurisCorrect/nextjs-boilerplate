import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server"; // ← ALIAS propre

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

    // Insertion dans public.submissions
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

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ ok: false, error: "DB_INSERT_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, submissionId: data.id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
