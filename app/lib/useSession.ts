// app/lib/useSession.ts
"use client"
import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "./supabase"
import type { Session } from "@supabase/supabase-js"

export function useSession() {
  const supabase = getSupabaseBrowser()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => setSession(sess))
    return () => { sub.subscription.unsubscribe() }
  }, [supabase])

  return session
}
