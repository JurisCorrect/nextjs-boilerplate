// app/api/correct/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://pbefzeeizgwdlkmduflt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4"
)

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      exercise_kind?: string
      matiere?: string
      sujet?: string
      copie?: string
      base64Docx?: string
      filename?: string
    }

    const normalizedBody = body.copie || "Document reçu, en attente d'extraction."

    const subIns = await supabase
      .from("submissions")
      .insert({
        exercise_kind: body.exercise_kind ?? "dissertation",
        matiere: body.matiere ?? "",
        sujet: body.sujet ?? "",
        copie: normalizedBody
      })
      .select("id")
      .single()

    if (subIns.error || !subIns.data) {
      return NextResponse.json(
        { error: "submissions insert failed" },
        { status: 500 }
      )
    }

    const result_json = {
      normalizedBody,
      globalComment: `Sujet reçu : ${body.sujet ?? ""}\n\nDébloquez la correction complète avec l'abonnement.`,
      pricing: [
        { label: "Correction de ce document", price: "3€" },
        { label: "5 corrections", price: "8€" },
        { label: "Illimité", price: "13€ / mois" }
      ]
    }

    const corrIns = await supabase
      .from("corrections")
      .insert({ submission_id: subIns.data.id, result_json })
      .select("id")
      .single()

    if (corrIns.error || !corrIns.data) {
      return NextResponse.json(
        { error: "corrections insert failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      correctionId: corrIns.data.id,
      submissionId: subIns.data.id
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
