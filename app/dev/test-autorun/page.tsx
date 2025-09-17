'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function TestAutoRun() {
  const router = useRouter()
  const sp = useSearchParams()
  const [msg, setMsg] = useState('Préparation…')

  useEffect(() => {
    let cancelled = false
    async function go() {
      // 1) Si pas connecté → redirige vers /login avec retour automatique ici
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMsg('Connexion requise…')
        const next = encodeURIComponent('/dev/test-autorun')
        router.replace(`/login?next=${next}`)
        return
      }

      // 2) Crée une submission de démo → appelle ta route create
      try {
        setMsg('Création de la soumission…')
        const r = await fetch('/api/submissions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payload: {
              text:
                "Sujet : La responsabilité administrative pour faute.\n" +
                "Introduction — Depuis l'arrêt Blanco, la responsabilité de l'administration…\n" +
                "I. La faute simple demeure le principe…\n" +
                "II. Vers un régime plus objectif…\n" +
                "Conclusion."
            }
          }),
        })
        if (r.status === 401) {
          // au cas où la route exige la session, on renvoie au login et on revient
          const next = encodeURIComponent('/dev/test-autorun')
          router.replace(`/login?next=${next}`)
          return
        }
        const data = await r.json()
        if (!r.ok || !data?.submissionId) {
          setMsg('Erreur : ' + (data?.error || 'inconnue'))
          return
        }

        // 3) Redirection immédiate vers la page CORRECTION
        if (!cancelled) {
          router.replace(`/correction/${encodeURIComponent(data.submissionId)}`)
        }
      } catch (e: any) {
        setMsg('Erreur : ' + (e?.message || 'inconnue'))
      }
    }
    go()
    return () => { cancelled = true }
  }, [router, sp])

  return (
    <main style={{ minHeight:'60vh', display:'grid', placeItems:'center' }}>
      <div style={{ display:'grid', gap:12, textAlign:'center' }}>
        <div aria-label="Chargement" style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgba(123,30,58,.25)', borderTopColor: '#7b1e3a',
          margin: '0 auto', animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color:'#fff' }}>{msg}</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </main>
  )
}
