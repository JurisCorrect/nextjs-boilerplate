// app/api/correct/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import mammoth from "mammoth"

export const runtime = "nodejs" // garantit Buffer disponible

const supabase = createClient(
  "https://pbefzeeizgwdlkmduflt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4"
)

type Body = {
  exercise_kind?: string
  matiere?: string
  sujet?: string
  // soit on envoie "copie" en clair, soit on envoie le .docx en base64
  copie?: string
  base64Docx?: string
  filename?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    // 1) Si on a reçu un .docx en base64, on l’extrait (en Node : { buffer })
    let extracted = ""
    if (body.base64Docx && body.base64Docx.trim() !== "") {
      const buf = Buffer.from(body.base64Docx, "base64")
      const { value } = await mammoth.extractRawText({ buffer: buf })
      extracted = (value || "").trim()
    }

    // 2) Corps normalisé (priorité au texte extrait)
    const normalizedBody =
      (extracted || body.copie || "").trim() || "Document reçu, en attente d’extraction."

    // 3) Créer la submission
    const subIns = await supabase
      .from("submissions")
      .insert({
        exercise_kind: body.exercise_kind ?? "dissertation",
        matiere: body.matiere ?? "",
        sujet: body.sujet ?? "",
        copie: normalizedBody,
      })
      .select("id")
      .single()

    if (subIns.error || !subIns.data) {
      console.error("SUBMISSION ERROR:", subIns.error)
      return NextResponse.json(
        { error: "submissions insert failed", detail: subIns.error?.message ?? subIns.error },
        { status: 500 }
      )
    }

    // 4) Créer la correction liée (avec tes 3 offres)
    const result_json = {
      normalizedBody,
      globalComment: `Sujet reçu : ${body.sujet ?? ""}\n\nDébloquez la correction complète.`,
      pricing: [
        { label: "Correction de ce document", price: "3€" },       // one-off
        { label: "10 corrections",           price: "8€" },        // ← mis à jour (8€)
        { label: "Illimité (mensuel)",       price: "13€ / mois" } // abonnement
      ],
    }

    const corrIns = await supabase
      .from("corrections")
      .insert({ submission_id: subIns.data.id, result_json })
      .select("id")
      .single()

    if (corrIns.error || !corrIns.data) {
      console.error("CORRECTION ERROR:", corrIns.error)
      return NextResponse.json(
        { error: "corrections insert failed", detail: corrIns.error?.message ?? corrIns.error },
        { status: 500 }
      )
    }

    // 5) Réponse
    return NextResponse.json({
      correctionId: corrIns.data.id,
      submissionId: subIns.data.id,
    })
  } catch (error: any) {
    console.error("API /api/correct error:", error)
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
