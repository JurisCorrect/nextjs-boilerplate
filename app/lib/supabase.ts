// app/lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

/** Client SERVEUR (Server Components / Route handlers) */
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anon) {
    throw new Error("Variables Supabase manquantes")
  }
  
  return createClient(url, anon, {
    auth: { persistSession: false }
  })
}
/** Client NAVIGATEUR (components "use client") */
export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anon) {
    throw new Error("Variables Supabase manquantes")
  }
  
  return createClient(url, anon)
}
