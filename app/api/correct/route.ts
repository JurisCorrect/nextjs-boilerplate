// app/api/correct/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Connexion Supabase directe
const supabase = createClient(
  'https://pbefzeeizgwdlkmduflt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4'
)

type Body = {
  exercise_kind: 'dissertation'|'commentaire'|'cas-pratique'
  matiere: string
  sujet: string
  copie: string
}

export async function POST(req: Request) {
  const data = (await req.json()) as Body
  const { exercise_kind, matiere, sujet, copie } = data
  
  if (!exercise_kind || !matiere?.trim() || !sujet?.trim() || !copie?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }
  
  // Générer un ID simple pour la correction
  const correctionId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
  
  // Créer une correction factice (comme avant)
  const mockCorrection = {
    id: correctionId,
    normalizedBody: copie,
    globalComment: `Sujet reçu : ${sujet.slice(0,120)}${sujet.length>120?'…':''}\n➤ Méthodologie : soignez structure et transitions.\n➤ Fond : citez vos références.`,
  }
  
  // Sauvegarder dans Supabase (optionnel, ne bloque pas si ça échoue)
  try {
    await supabase.from('corrections').insert({
      id: correctionId,
      result_json: mockCorrection
    })
  } catch (e) {
    // Continue même si la sauvegarde échoue
    console.log('Supabase save failed, continuing...')
  }
  
  return NextResponse.json({ correctionId: correctionId })
}
