// app/lib/supabase-admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,               // ⚠️ pas NEXT_PUBLIC
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ clé Service Role
  { auth: { persistSession: false } }
)
