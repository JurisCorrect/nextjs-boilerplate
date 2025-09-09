// app/lib/useSession.ts
"use client"
import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "./supabase"
import type { Session } from "@supabase/supabase-js"

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return session
}
