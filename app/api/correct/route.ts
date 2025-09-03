// app/api/correct/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Connexion Supabase directe pour éviter les problèmes d'import
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
  
  // 1) Enregistrer la soumission
  const { data: sub, error: subErr } = await supabase
    .from('submissions')
    .insert({ exercise_kind, matiere, sujet, copie })
    .select()
    .single()
    
  if (subErr || !sub) return NextResponse.json({ error: subErr?.message || 'Erreur insertion' }, { status: 500 })
  
  // 2) Générer une "correction" factice (on branchera TON IA ensuite)
  const mock = {
    normalizedBody: copie,
    inline: [
      { start: 0, end: Math.min(120, copie.length), tone: 'blue', label: 'Méthodologie', message: "Annonce de plan à vérifier." }
    ],
    margin: [],
    globalComment: `Sujet reçu : ${sujet.slice(0,120)}${sujet.length>120?'…':''}\n➤ Méthodo : soignez structure et transitions.\n➤ Fond : citez vos références.`,
    indicativeGrade: { score: 12, outOf: 20, rubric: 'indicative' }
  }
  
  const { data: corr, error: corrErr } = await supabase
    .from('corrections')
    .insert({ submission_id: sub.id, result_json: mock })
    .select()
    .single()
    
  if (corrErr || !corr) return NextResponse.json({ error: corrErr?.message || 'Erreur correction' }, { status: 500 })
  
  return NextResponse.json({ correctionId: corr.id })
}
