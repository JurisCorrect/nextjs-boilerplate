// app/api/upload/route.ts
import { NextResponse } from "next/server"
import mammoth from "mammoth"

export const runtime = "nodejs" // force l'exécution Node (pas Edge)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // On lit le fichier et on passe un ArrayBuffer à mammoth (valide)
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    return NextResponse.json({
      text: result.value ?? "",
      messages: result.messages ?? [],
      filename: file.name,
    })
  } catch (err) {
    console.error("Erreur extraction /api/upload:", err)
    return NextResponse.json(
      { error: "Erreur lors de l’extraction du texte" },
      { status: 500 }
    )
  }
}
