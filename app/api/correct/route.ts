import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ⚠️ Utilise tes valeurs Supabase directes — celles qui fonctionnaient déjà.
// (Tu les avais collées côté build, on reprend la même logique simple)
const supabase = createClient(
  'https://pbefzeeizgwdlkmduflt.supabase.co',
  // Clé "anon" que tu utilisais (ok côté serveur pour ce besoin)
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4'
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { exercise_kind, matiere, sujet, copie } = body as {
      exercise_kind?: string
      matiere?: string
      sujet?: string
      copie?: string
    }

    // 1) On crée une submission (comme avant)
    const { data: sub, error: subErr } = await supabase
      .from('submissions')
      .insert({
        exercise_kind: exercise_kind ?? 'dissertation',
        matiere: matiere ?? '',
        sujet: sujet ?? '',
        copie: copie ?? ''
      })
      .select('id')
      .single()

    if (subErr || !sub) {
      console.error('Supabase insert submissions error:', subErr)
      throw new Error('Impossible de créer la soumission')
    }

    // 2) On crée la correction liée avec le format attendu par la page
    const result_json = {
      // texte “défloutable” derrière
      normalizedBody: (copie ?? '').trim() || 'Contenu du document déposé.',
      // un commentaire global simple (ta page l’affichait)
      globalComment: `Sujet reçu : ${sujet ?? ''}\n\nDébloquez la correction complète avec l’abonnement.`,
      // un petit bloc d’infos prix pour l’encadré bordeaux
      pricing: [
        { label: '5 corrections', price: '5€ / mois' },
        { label: '10 corrections', price: '8€ / mois' }
      ]
    }

    const { data: corr, error: corrErr } = await supabase
      .from('corrections')
      .insert({
        submission_id: sub.id,
        result_json
      })
      .select('id')
      .single()

    if (corrErr || !corr) {
      console.error('Supabase insert corrections error:', corrErr)
      throw new Error('Impossible de créer la correction')
    }

    // 3) On renvoie l’ID exact que /correction/[id] va utiliser
    return NextResponse.json({ correctionId: corr.id })
  } catch (error: any) {
    console.error('API /api/correct error:', error)
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
