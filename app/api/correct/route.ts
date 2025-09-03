import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pbefzeeizgwdlkmduflt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4'
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { exercise_kind, matiere, sujet, copie } = body as {
      exercise_kind?: string; matiere?: string; sujet?: string; copie?: string
    }

    const subIns = await supabase
      .from('submissions')
      .insert({
        exercise_kind: exercise_kind ?? 'dissertation',
        matiere: matiere ?? '',
        sujet: sujet ?? '',
        copie: (copie ?? '').toString()
      })
      .select('id')
      .single()

    if (subIns.error || !subIns.data) {
      console.error('SUBMISSION ERROR:', subIns.error)
      return NextResponse.json(
        { error: 'submissions insert failed', detail: subIns.error?.message ?? subIns.error },
        { status: 500 }
      )
    }

    const result_json = {
      normalizedBody: (copie ?? '').trim() || 'Contenu du document déposé.',
      globalComment: `Sujet reçu : ${sujet ?? ''}\n\nDébloquez la correction complète avec l’abonnement.`,
      pricing: [
        { label: '5 corrections', price: '5€ / mois' },
        { label: '10 corrections', price: '8€ / mois' }
      ]
    }

    const corrIns = await supabase
      .from('corrections')
      .insert({ submission_id: subIns.data.id, result_json })
      .select('id')
      .single()

    if (corrIns.error || !corrIns.data) {
      console.error('CORRECTION ERROR:', corrIns.error)
      return NextResponse.json(
        { error: 'corrections insert failed', detail: corrIns.error?.message ?? corrIns.error },
        { status: 500 }
      )
    }

    // 💡 renvoyer les 2 IDs
    return NextResponse.json({
      correctionId: corrIns.data.id,
      submissionId: subIns.data.id
    })
  } catch (error: any) {
    console.error('API /api/correct error:', error)
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    )
  }
}
