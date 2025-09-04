// app/api/correct/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import mammoth from "mammoth"

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
      // soit on envoie "copie" en clair, soit on envoie le .docx en base64
      copie?: string
      base64Docx?: string
      filename?: string
    }

    // 1) Si on a reçu un .docx en base64, on l'extrait
    let extracted = ""
    if (body.base64Docx) {
      // Convertir base64 vers ArrayBuffer pour Vercel
      const binaryString = atob(body.base64Docx)
      const arrayBuffer = new ArrayBuffer(binaryString.length)
      const uint8Array = new Uint8Array(arrayBuffer)
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }
      const { value } = await mammoth.extractRawText({ arrayBuffer })
      extracted = (value || "").trim()
    }

    const normalizedBody =
      (extracted || body.copie || "").trim() || "Document reçu, en attente d'extraction."

    // 2) Créer la submission
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
      console.error("SUBMISSION ERROR:", subIns.error)
      return NextResponse.json(
        { error: "submissions insert failed", detail: subIns.error?.message ?? subIns.error },
        { status: 500 }
      )
    }

    // 3) Créer la correction liée (texte justifié + forfaits)
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
      console.error("CORRECTION ERROR:", corrIns.error)
      return NextResponse.json(
        { error: "corrections insert failed", detail: corrIns.error?.message ?? corrIns.error },
        { status: 500 }
      )
    }

    // on renvoie les 2 IDs (pour être compatibles avec ta page)
    return NextResponse.json({
      correctionId: corrIns.data.id,
      submissionId: subIns.data.id
    })

  } catch (error: any) {
    console.error("API /api/correct error:", error)
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
