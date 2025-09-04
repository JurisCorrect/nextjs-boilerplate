import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: 'Format non supporté. Veuillez utiliser un fichier .docx' }, { status: 400 })
    }

    // Taille limite : 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Limite : 10MB' }, { status: 400 })
    }

    // Conversion en buffer pour mammoth
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Extraction du texte avec mammoth
    const result = await mammoth.extractRawText({ buffer: uint8Array })
    
    if (!result.value || result.value.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Impossible d\'extraire le texte. Vérifiez que le document contient du texte.' 
      }, { status: 400 })
    }

    // Nettoyage du texte
    let cleanText = result.value
      .replace(/\r\n/g, '\n')           // Normaliser les retours à la ligne
      .replace(/\n{3,}/g, '\n\n')       // Limiter les lignes vides consécutives
      .trim()

    // Vérification de longueur minimale pour un devoir juridique
    if (cleanText.length < 500) {
      return NextResponse.json({ 
        error: 'Le document semble trop court pour un devoir juridique (minimum 500 caractères)' 
      }, { status: 400 })
    }

    // Avertissements non bloquants
    const warnings = []
    if (result.messages && result.messages.length > 0) {
      warnings.push('Certains éléments de mise en forme ont été ignorés lors de l\'extraction')
    }

    return NextResponse.json({
      text: cleanText,
      info: {
        filename: file.name,
        size: file.size,
        characterCount: cleanText.length,
        wordCount: cleanText.split(/\s+/).length,
        warnings
      }
    })

  } catch (error: any) {
    console.error('Erreur extraction Word:', error)
    
    // Messages d'erreur spécifiques
    if (error.message?.includes('not a valid docx')) {
      return NextResponse.json({ 
        error: 'Fichier Word corrompu ou invalide. Essayez de le réenregistrer.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Erreur lors de l\'extraction du texte. Vérifiez le format du fichier.' 
    }, { status: 500 })
  }
}
