// app/api/correct/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase direct avec vos vraies valeurs
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
  try {
    const data = (await req.json()) as Body
    const { exercise_kind, matiere, sujet, copie } = data
    
    if (!matiere?.trim()) {
      return NextResponse.json({ error: "Merci d'indiquer la matière." }, { status: 400 })
    }
    if (!sujet?.trim()) {
      return NextResponse.json({ error: "Merci d'indiquer le sujet." }, { status: 400 })
    }
    if (!copie?.trim()) {
      return NextResponse.json({ error: "Merci de verser le document Word (.docx)." }, { status: 400 })
    }

    // Création du résultat de correction
    const result_json = {
      normalizedBody: copie,
      globalComment: `Sujet reçu : ${sujet}\n\nCommentaires détaillés en cours de génération...`,
    }

    // Insertion dans Supabase
    const { data: correction, error } = await supabase
      .from('corrections')
      .insert({ result_json })
      .select('id')
      .single()

    if (error || !correction?.id) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json({ correctionId: correction.id })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
