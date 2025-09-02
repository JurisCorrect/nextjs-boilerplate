// app/api/upload/route.ts
import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 })
    }

    const name = file.name?.toLowerCase() || ''
    if (!name.endsWith('.docx')) {
      return NextResponse.json({ error: 'Format non supporté. Importez un fichier .docx.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extraction texte brut (plus fiable pour l’IA)
    const { value: text } = await mammoth.extractRawText({ buffer })

    // Sanitize simple
    const cleaned = (text || '').replace(/\r\n/g, '\n').trim()

    if (!cleaned) {
      return NextResponse.json({ error: 'Le fichier .docx ne contient pas de texte exploitable.' }, { status: 400 })
    }

    return NextResponse.json({
      filename: file.name,
      text: cleaned,
      length: cleaned.length,
    })
  } catch (err: any) {
    console.error('[UPLOAD] erreur', err)
    return NextResponse.json({ error: err?.message ?? 'Erreur upload.' }, { status: 500 })
  }
}
