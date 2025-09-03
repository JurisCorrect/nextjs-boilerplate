// app/lib/supabase-admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'

// fabrique un client "admin" à la demande (évite l'évaluation au build)
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // message explicite si jamais une variable manque à l'exécution
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
