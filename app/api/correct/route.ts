// app/api/correct/route.ts
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/app/lib/supabase-admin"

export const runtime = "nodejs"

type Body = {
  exercise_kind?: "dissertation" | "commentaire" | "cas-pratique"
  matiere?: string
  sujet?: string
  copie?: string
}

export async function POST(req: Request) {
  try {
    const { exercise_kind, matiere, sujet, copie }: Body = await req.json()

    if (!matiere?.trim()) return NextResponse.json({ error: "Merci d’indiquer la matière." }, { status: 400 })
    if (!sujet?.trim())   return NextResponse.json({ error: "Merci d’indiquer le sujet." }, { status: 400 })
    if (!copie?.trim())   return NextResponse.json({ error: "Merci de verser le document Word (.docx)." }, { status: 400 })

    const result_json = {
      normalizedBody: copie,
      globalComment: `Sujet reçu : ${sujet}\n\nCommentaires détaillés en cours de génération...`,
      kind: exercise_kind ?? "dissertation",
      matiere,
    }

    const { data, error } = await supabaseAdmin
      .from("corrections")
      .insert({ result_json })
      .select("id")
      .single()

    if (error || !data?.id) {
      console.error("Supabase insert error:", error)
      return NextResponse.json(
        { error: "Impossible d’enregistrer la correction (DB).", details: error?.message || null },
        { status: 500 }
      )
    }

    return NextResponse.json({ correctionId: data.id })
  } catch (e: any) {
    console.error("API /api/correct error:", e)
    return NextResponse.json({ error: "Requête invalide ou serveur indisponible." }, { status: 500 })
  }
}
