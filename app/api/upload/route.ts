import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Extraire le texte avec mammoth
    const result = await mammoth.extractRawText({ arrayBuffer: uint8Array.buffer })
    
    return NextResponse.json({ 
      text: result.value,
      messages: result.messages 
    })

  } catch (error) {
    console.error('Erreur extraction:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'extraction du texte' 
    }, { status: 500 })
  }
}
