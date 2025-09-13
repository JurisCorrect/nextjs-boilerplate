'use client'

import { useEffect, useMemo, useState } from 'react'

export default function EspaceClientPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  if (typeof window === 'undefined') {
    return (
      <main className="page-wrap">
        <h1 className="page-title">ESPACE CLIENT</h1>
        <section className="panel"><p style={{color:'#fff',opacity:.8}}>Chargement…</p></section>
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
        const supabase = await getSupabase()
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        if (!data?.user) { window.location.href = '/login'; return }
        setUser(data.user); setLoading(false)
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) window.location.href = '/login' })
        return () => sub?.subscription?.unsubscribe?.()
      } catch (e) { setMsg({type:'err', text:e.message}); setLoading(false) }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  async function handleSignOut() {
    try { const s = await getSupabase(); await s.auth.signOut(); window.location.href = '/login' }
    catch { setMsg({type:'err', text:'Déconnexion impossible'}) }
  }

  const ACCENT = '#7b1e3a'
  const Soft = { background:'rgba(255,255,255,0.06)', borderRadius:20 }
  const Tile = { background:'rgba(255,255,255,0.08)', borderRadius:14, padding:18, textDecoration:'none' }

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'

  if (loading) {
    return (
      <main className="page-wrap" style={{maxWidth:1120, margin:'0 auto'}}>
        <h1 className="page-title">ESPACE CLIENT</h1>
        <section className="panel" style={{ ...Soft, padding:20 }}><p style={{ color:'#fff', opacity:.8 }}>Chargement…</p></section>
      </main>
    )
  }

  return (
    <main className="page-wrap" style={{maxWidth:1120, margin:'0 auto'}}>
      {/* ONGLET Déconnexion (haut droit) */}
      <button
        onClick={handleSignOut}
        style={{
          position:'fixed', top:16, right:16, zIndex:50,
          background:'#fff', color:ACCENT, fontWeight:800,
          border:'none', borderRadius:999, padding:'10px 16px',
          boxShadow:'0 8px 24px rgba(0,0,0,0.15)', cursor:'pointer'
        }}
      >
        Me déconnecter
      </button>

      {/* HERO : Titre + Carte membre (titre remonté, pas d’ID) */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,1fr) 340px', gap:22, alignItems:'stretch', marginBottom:22 }}>
        <div>
          <h1 className="page-title" style={{ lineHeight:1.05, marginBottom:10 }}>
            Bienvenue sur<br/>votre compte <span style={{ color:'#fff', background:'#ffffff22', padding:'0 6px', borderRadius:8 }}>JurisCorrect</span>
          </h1>
          <p style={{ color:'#fff', opacity:.88, maxWidth:640 }}>
            Ravie de vous revoir <strong>{user?.email}</strong>. Retrouvez vos corrections et gérez votre abonnement en un seul endroit.
          </p>
        </div>

        <div style={{ ...Soft, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.15)', display:'grid', gridTemplateRows:'auto 1fr', gap:12 }}>
          <div style={{ fontWeight:900, color:'#fff', letterSpacing:.2, marginTop:2 }}>
            Votre carte-membre
          </div>
          <div style={{
            background:`linear-gradient(135deg, ${ACCENT}, #a43a57)`,
            borderRadius:14, padding:16, color:'#fff',
            display:'grid', alignContent:'space-between', gap:10, minHeight:110
          }}>
            <div style={{ fontSize:12, opacity:.95 }}>Titulaire</div>
            <div style={{ fontWeight:800, fontSize:16 }}>{user?.email}</div>
            <div style={{ fontSize:12, opacity:.9 }}>Membre depuis le {createdAt}</div>
          </div>
        </div>
      </div>

      {/* Rubriques */}
      <h2 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:'6px 0 12px' }}>Votre espace personnel</h2>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:14 }}>
        {/* Mes corrections */}
        <a href="/espace-client/corrections" style={{ ...Tile }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>
            Mes corrections
          </div>
          <ul style={{ color:'#fff', opacity:.9, fontSize:14, lineHeight:1.55, margin:'0 0 12px 18px' }}>
            <li>Historique complet des corrections passées</li>
            <li>Date de soumission</li>
            <li>Téléchargement PDF des corrections</li>
          </ul>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#fff', color:ACCENT, display:'grid', placeItems:'center', fontWeight:900 }}>→</div>
          </div>
        </a>

        {/* Gestion de l’abonnement */}
        <a href="/espace-client/abonnement" style={{ ...Tile }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>
            Gestion de l’abonnement
          </div>
          <ul style={{ color:'#fff', opacity:.9, fontSize:14, lineHeight:1.55, margin:'0 0 12px 18px' }}>
            <li>Plan actuel (5€ ponctuel ou 12,99€/mois)</li>
            <li>Prochaine date de facturation</li>
            <li>Historique des paiements</li>
            <li>Boutons “Changer de plan” et “Résilier”</li>
            <li>Lien vers le portail client Stripe</li>
          </ul>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#fff', color:'#7b1e3a', display:'grid', placeItems:'center', fontWeight:900 }}>→</div>
          </div>
        </a>

        {/* Mon compte */}
        <a href="/espace-client/compte" style={{ ...Tile }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>
            Mon compte
          </div>
          <ul style={{ color:'#fff', opacity:.9, fontSize:14, lineHeight:1.55, margin:'0 0 12px 18px' }}>
            <li>Email de connexion</li>
            <li>Changer le mot de passe</li>
            <li>Préférences de notification email</li>
          </ul>
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#fff', color:'#7b1e3a', display:'grid', placeItems:'center', fontWeight:900 }}>→</div>
          </div>
        </a>
      </div>

      {/* Support */}
      <p style={{ color:'#fff', opacity:.85, margin:'22px 0 0' }}>
        Besoin d’aide ? Écrivez-nous : <a href="mailto:marie.terki@icloud.com" style={{ color:'#fff', textDecoration:'underline', textUnderlineOffset:4 }}>marie.terki@icloud.com</a>
      </p>

      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:60,
          padding:'10px 14px', borderRadius:12, fontWeight:700,
          color: msg.type==='ok' ? '#2ed573' : '#ff6b6b',
          background: msg.type==='ok' ? 'rgba(46,213,115,0.12)' : 'rgba(255,107,107,0.12)'
        }}>
          {msg.text}
        </div>
      )}
    </main>
  )
}
