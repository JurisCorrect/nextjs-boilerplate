'use client'

import { useEffect, useMemo, useState } from 'react'

export default function EspaceClientHome() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  // ENV
  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  // SSR guard
  if (typeof window === 'undefined') {
    return (
      <main className="page-wrap">
        <h1 className="page-title">ESPACE CLIENT</h1>
        <section className="panel"><p>Chargement…</p></section>
      </main>
    )
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
        const { data: sub } = s.auth.onAuthStateChange((_e, session) => { if (!session) window.location.href = '/login' })
        return () => sub?.subscription?.unsubscribe?.()
      } catch (e) {
        setMsg({ type: 'err', text: e.message || "Erreur d'initialisation" })
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  async function handleSignOut() {
    try { const s = await getSupabase(); await s.auth.signOut(); window.location.href = '/login' }
    catch { setMsg({ type:'err', text:'Déconnexion impossible' }) }
  }

  // ----- STYLE TOKENS (fond blanc + accents bordeaux) -----
  const ACCENT = '#7b1e3a'            // bordeaux
  const SURFACE = '#ffffff'            // cartes et fond
  const TEXT = '#1c1c1c'               // texte sombre
  const SUBTEXT = 'rgba(0,0,0,.65)'

  const wrap = { maxWidth: 1120, margin: '0 auto', padding: '8px 16px 40px' }
  const heroCard = {
    background: SURFACE, borderRadius: 16, padding: 22,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.04)'
  }
  const grid = { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }
  const tile = {
    background: SURFACE, borderRadius: 16, padding: 18, textDecoration: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)'
  }
  const tileTitle = { color: ACCENT, fontWeight: 800, marginBottom: 8 }
  const tileBullet = { color: SUBTEXT, fontSize: 14, lineHeight: 1.55, margin: '0 0 12px 18px' }

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'

  if (loading) {
    return (
      <main className="page-wrap" style={{ ...wrap, background: SURFACE }}>
        <h1 className="page-title" style={{ color: ACCENT }}>ESPACE CLIENT</h1>
        <section className="panel" style={heroCard}><p>Chargement…</p></section>
      </main>
    )
  }

  return (
    <main className="page-wrap" style={{ ...wrap, background: SURFACE }}>
      {/* Onglet déconnexion — fond bordeaux sur fond blanc */}
      <button
        onClick={handleSignOut}
        style={{
          position:'fixed', top:16, right:16, zIndex:50,
          background: ACCENT, color:'#fff', fontWeight:800,
          border:'none', borderRadius: 999, padding:'10px 16px',
          boxShadow:'0 10px 24px rgba(0,0,0,.18)', cursor:'pointer'
        }}
      >
        Me déconnecter
      </button>

      {/* HERO (style comme ta phrase d’accueil : surface blanche, titre bordeaux) */}
      <div style={heroCard}>
        <h1 className="page-title" style={{ color: ACCENT, lineHeight: 1.05, marginBottom: 12 }}>
          Bienvenue sur votre compte JurisCorrect
        </h1>
        <p style={{ color: SUBTEXT, fontSize: 16 }}>
          Ravie de vous revoir <strong style={{ color: TEXT }}>{user?.email}</strong>. Retrouvez vos corrections,
          gérez votre abonnement et vos informations de compte en un seul endroit. <br />
          <span style={{ color: 'rgba(0,0,0,.55)', fontSize: 13 }}>Membre depuis le {createdAt}</span>
        </p>
      </div>

      {/* Rubriques (3 tuiles) */}
      <h2 style={{ color: ACCENT, fontSize: 22, fontWeight: 900, margin: '18px 0 10px' }}>
        Votre espace personnel
      </h2>

      <div style={grid}>
        {/* Mes corrections */}
        <a href="/espace-client/corrections" style={tile}>
          <div style={tileTitle}>Mes corrections</div>
          <ul style={tileBullet}>
            <li>Historique complet des corrections passées</li>
            <li>Date de soumission</li>
            <li>Téléchargement PDF des corrections</li>
          </ul>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius: '50%', background: ACCENT, color:'#fff',
              display:'grid', placeItems:'center', fontWeight:900 }}>→</div>
          </div>
        </a>

        {/* Gestion de l’abonnement */}
        <a href="/espace-client/abonnement" style={tile}>
          <div style={tileTitle}>Gestion de l’abonnement</div>
          <ul style={tileBullet}>
            <li>Plan actuel (5€ ponctuel ou 12,99€/mois)</li>
            <li>Prochaine date de facturation</li>
            <li>Historique des paiements</li>
            <li>Changer de plan / Résilier</li>
            <li>Portail client Stripe</li>
          </ul>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius: '50%', background: ACCENT, color:'#fff',
              display:'grid', placeItems:'center', fontWeight:900 }}>→</div>
          </div>
        </a>

        {/* Mon compte */}
        <a href="/espace-client/compte" style={tile}>
          <div style={tileTitle}>Mon compte</div>
          <ul style={tileBullet}>
            <li>Email de connexion</li>
            <li>Changer le mot de passe</li>
            <li>Préférences de notification email</li>
          </ul>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius: '50%', background: ACCENT, color:'#fff',
              display:'grid', placeItems:'center', fontWeight:900 }}>→</div>
          </div>
        </a>
      </div>

      {/* Support */}
      <p style={{ color: SUBTEXT, margin: '22px 0 0' }}>
        Besoin d’aide ? Écrivez-nous :{' '}
        <a href="mailto:marie.terki@icloud.com" style={{ color: ACCENT, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }}>
          marie.terki@icloud.com
        </a>
      </p>

      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:60,
          padding:'10px 14px', borderRadius:12, fontWeight:700,
          color: msg.type==='ok' ? '#2e7d32' : '#b71c1c',
          background: msg.type==='ok' ? 'rgba(46,125,50,0.12)' : 'rgba(183,28,28,0.12)'
        }}>
          {msg.text}
        </div>
      )}
    </main>
  )
}
