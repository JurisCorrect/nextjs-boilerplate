// app/api/dissertation/submit/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "../../../lib/supabase/server"; // chemin RELATIF pour éviter les soucis d'alias

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// On valide ce qui arrive depuis le formulaire
const BodySchema = z.object({
  course: z.string().min(2, "La matière est requise"),        // ex: "Droit constit."
  subject: z.string().min(4, "Le sujet est requis"),          // libellé du sujet
  content: z.string().min(50, "Le texte est trop court"),     // copie de l'élève (texte)
});

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();

    // 1) Vérifier l'utilisateur connecté
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      return NextResponse.json({ error: "Auth error", details: userErr.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    // 2) Lire + valider le body
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { course, subject, content } = parsed.data;

    // 3) Insérer dans la table submissions
    // ⚠️ Adapte ces noms si ta table a d'autres colonnes/orthographes.
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,                 // doit exister dans ta table
        exercise_type: "dissertation",    // "dissertation" doit être autorisé par ton enum / champ texte
        course,                           // matière
        subject,                          // sujet
        input_text: content,              // le texte de la copie
        status: "pending",                // on traitera plus tard
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: "DB insert error", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message }, { status: 500 });
  }
}
