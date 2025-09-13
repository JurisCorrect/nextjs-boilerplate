'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function CorrectionsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  if (typeof window === 'undefined') {
    return <main style={{ background:'#fff', minHeight:'100vh' }} />
  }

  const getSupabase = useMemo(() => async () => {
    const { createClient } = await import('@supabase/supabase-js')
    if (!envOk) throw new Error('Variables Supabase manquantes')
    return createClient(ENV_URL, ENV_KEY)
  }, [ENV_URL, ENV_KEY, envOk])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await getSupabase()
        const { data } = await s.auth.getUser()
        if (!mounted) return
        if (!data?.user) { window.location.href = '/login'; return }
        setUser(data.user); setLoading(false)
      } catch (e) { setMsg({ type:'err', text:e.message }); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  // ----- THEME (mêmes tokens que ta home) -----
  const BRAND = 'var(--brand)'
  const BRAND2 = 'var(--brand-2)'
  const MUTED = 'var(--muted)'
  const cta = {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'10px 16px', borderRadius:14, fontWeight:800,
    background:'linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)',
    color:'#fff', textDecoration:'none', border:'none', boxShadow:'0 12px 30px rgba(123,30,58,.35)', cursor:'pointer'
  }
  const card = {
    background:'#fff', borderRadius:16,
    padding:'clamp(18px, 2.4vw, 26px)',
    boxShadow:'0 10px 30px rgba(0,0,0,.08)', border:'1px solid rgba(0,0,0,.04)'
  }

  // ---- Données (placeholder – à brancher) ----
  const rows = [
    { id:'c1', titre:'Dissertation – Droit civil', date:'12/09/2025', pdf:'#' },
    { id:'c2', titre:'Cas pratique – Procédure',   date:'05/09/2025', pdf:'#' },
    { id:'c3', titre:'Commentaire – Libertés',      date:'29/08/2025', pdf:'#' },
  ]

  return (
    <main style={{ background:'#fff', minHeight:'100vh' }}>
      <div className="container" style={{ padding:'20px 16px 0' }}>
        <section style={{ ...card, marginInline:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <h1 style={{ color:BRAND, fontWeight:900, margin:0, lineHeight:1.05 }}>Mes corrections</h1>
            <Link href="/espace-client" style={cta}>← Retour</Link>
          </div>
          <p style={{ color:MUTED, margin:'8px 0 0' }}>
            Retrouvez l’historique de vos corrections, la date de soumission et téléchargez vos PDF.
          </p>
        </section>
      </div>

      <div className="container" style={{ padding:'18px 16px 44px' }}>
        <section style={{ ...card }}>
          {/* En-tête tableau */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 180px 140px',
            gap:12, padding:'8px 6px', color:'#222', fontWeight:800
          }}>
            <div>Titre</div>
            <div>Date de soumission</div>
            <div>Téléchargement</div>
          </div>
          <div style={{ height:1, background:'rgba(0,0,0,.06)', margin:'6px 0 8px' }} />

          {/* Lignes */}
          {rows.map(r => (
            <div key={r.id} style={{
              display:'grid',
              gridTemplateColumns:'1fr 180px 140px',
              gap:12, padding:'12px 6px', alignItems:'center', color:'#222'
            }}>
              <div>{r.titre}</div>
              <div style={{ color:MUTED }}>{r.date}</div>
              <div>
                <a href={r.pdf} className="btn-send"
                   style={{ ...cta, padding:'8px 14px', boxShadow:'none' }}>
                  PDF
                </a>
              </div>
            </div>
          ))}
        </section>

        {/* Alerte si ENV manquantes */}
        {!envOk && (
          <p style={{ color:'#b71c1c', marginTop:12 }}>
            Variables Supabase absentes. Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel.
          </p>
        )}
      </div>

      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:10,
          padding:'10px 14px', borderRadius:12,
          background:'rgba(183,28,28,0.12)', color:'#b71c1c', fontWeight:700
        }}>{msg.text}</div>
      )}
    </main>
  )
}
