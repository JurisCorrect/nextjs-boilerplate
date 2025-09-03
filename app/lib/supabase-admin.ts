// app/lib/supabase-admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,               // ⚠️ URL non publique
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ Service Role (jamais côté client)
  { auth: { persistSession: false } }
)
