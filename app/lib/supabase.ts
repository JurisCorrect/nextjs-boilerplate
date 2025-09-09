// app/lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!URL || !ANON) {
  // Ne pas throw à l'import côté build, on vérifiera à l’appel.
  console.warn("Supabase env manquantes: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

let browserClient: ReturnType<typeof createClient> | null = null

/** Client SERVEUR (app router / server components / route handlers) */
export function getSupabase() {
  if (!URL || !ANON) throw new Error("Supabase: variables d'environnement manquantes.")
  return createClient(URL, ANON, {
    auth: { persistSession: false },
  })
}

/** Client NAVIGATEUR (components 'use client') */
export function getSupabaseBrowser() {
  if (!URL || !ANON) throw new Error("Supabase: variables d'environnement manquantes.")
  if (!browserClient) {
    browserClient = createClient(URL, ANON, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  }
  return browserClient
}
