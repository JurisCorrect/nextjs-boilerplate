// app/api/correct/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import mammoth from "mammoth"

export const runtime = "nodejs"

const supabase = createClient(
  "https://pbefzeeizgwdlkmduflt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4"
)

type Body = {
  exercise_kind?: string
  matiere?: string
  sujet?: string
  copie?: string
  base64Docx?: string
  filename?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    // Extraction docx si envoyé en base64
    let extracted = ""
    if (body.base64Docx && body.base64Docx.trim() !== "") {
      const buf = Buffer.from(body.base64Docx, "base64")
      const { value } = await mammoth.extractRawText({ buffer: buf })
      extracted = (value || "").trim()
    }

    const normalizedBody =
      (extracted || body.copie || "").trim() || "Document reçu, en attente d'extraction."

    // submission
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
      return NextResponse.json(
        { error: "submissions insert failed", detail: subIns.error?.message ?? subIns.error },
        { status: 500 }
      )
    }

    // correction avec les NOUVEAUX prix (5€ et 12,99€/mois)
    const result_json = {
      normalizedBody,
      globalComment: `Sujet reçu : ${body.sujet ?? ""}\n\nDébloquez la correction complète.`,
      pricing: [
        { label: "Correction unique",        price: "5€" },
        { label: "Illimité (mensuel)",       price: "12,99€ / mois" },
      ],
    }

    const corrIns = await supabase
      .from("corrections")
      .insert({ submission_id: subIns.data.id, result_json })
      .select("id")
      .single()

    if (corrIns.error || !corrIns.data) {
      return NextResponse.json(
        { error: "corrections insert failed", detail: corrIns.error?.message ?? corrIns.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      correctionId: corrIns.data.id,
      submissionId: subIns.data.id,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
