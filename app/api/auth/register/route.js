import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://pbefzeeizgwdlkmduflt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4"
)

export async function POST(req) {
  try {
    const formData = await req.formData()
    const email = formData.get('email')
    const password = formData.get('password')
    const confirmPassword = formData.get('confirm-password')
    
    // Validation des mots de passe
    if (password !== confirmPassword) {
      return Response.json({ error: 'Les mots de passe ne correspondent pas' }, { status: 400 })
    }
    
    // Créer l'utilisateur dans Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })
    
    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    return Response.json({ 
      message: 'Compte créé avec succès ! Vérifiez votre email pour confirmer votre inscription.',
      needsConfirmation: true 
    })
    
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
