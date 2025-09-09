// app/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// --- Server (pages/route handlers) ---
let serverClient: SupabaseClient | null = null
export function getSupabase(): SupabaseClient {
  if (serverClient) return serverClient
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquant.')
  serverClient = createClient(url, anon, { auth: { persistSession: false } })
  return serverClient
}

// --- Client (components "use client") ---
export function getSupabaseBrowser(): SupabaseClient {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  return createClient(url, anon)
}
