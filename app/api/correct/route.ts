import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pbefzeeizgwdlkmduflt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4'
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const result_json = {
      normalizedBody: body.copie || 'Contenu du document Word déposé',
      globalComment: `Sujet reçu : ${body.sujet}\n\nCommentaires détaillés en cours de génération...`
    }
    
    const { data, error } = await supabase
      .from('corrections')
      .insert({ result_json })
      .select('id')
      .single()
    
    if (error || !data) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }
    
    return NextResponse.json({ correctionId: data.id })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
