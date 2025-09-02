"use client"
import { useEffect, useState } from "react"
import { supabase } from "./supabase"

export function useSession() {
  const [session, setSession] = useState<any>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => { sub.subscription.unsubscribe() }
  }, [])
  return session
}
