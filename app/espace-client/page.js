'use client'

import { useEffect, useMemo, useState } from 'react'

export default function EspaceClientPage() {
  // ---- STATE ----
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null) // {type:'ok'|'err', text}

  // ENV (garde-fou)
  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  // SSR guard
  if (typeof window === 'undefined') {
    return (
      <main className="page-wrap">
        <h1 className="page-title">ESPACE CLIENT</h1>
        <section className="panel"><p style={{color:'#fff',opacity:.8}}>Chargement…</p></section>
      </main>
    )
  }

  // Lazy supabase client
  const getSupabase = useMemo(() => async () => {
    const { createClient } = await import('@supabase/supabase-js')
    if (!envOk) throw new Error("Variables Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).")
    return createClient(ENV_URL, ENV_KEY)
  }, [ENV_URL, ENV_KEY, envOk])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const supabase = await getSupabase()
        const { data } = await supabase.auth.getUser()
        if (!mounted) return
        if (!data?.user) {
          window.location.href = '/login'
          return
        }
        setUser(data.user)
        setLoading(false)

        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
          if (!session) window.location.href = '/login'
        })
        return () => sub?.subscription?.unsubscribe?.()
      } catch (e) {
        setMsg({ type:'err', text: e.message || "Erreur d'initialisation" })
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  async function handleSignOut() {
    try {
      const supabase = await getSupabase()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch {
      setMsg({ type:'err', text:'Déconnexion impossible' })
    }
  }

  // ---- DESIGN ----
  const ACCENT = '#7b1e3a' // bordeaux
  // fond bordeaux partout (si ton thème le fait déjà, ce style n’aura pas d’impact)
  const wrapperStyle = { maxWidth: 1120, margin: '0 auto' }

  // composants visuels sans bordures blanches
  const Soft = { background:'rgba(255,255,255,0.06)', borderRadius:20 } // pas de border
  const Tile = { background:'rgba(255,255,255,0.08)', borderRadius:14, padding:18, textDecoration:'none' }

  const initials = (user?.email || 'U').slice(0,1).toUpperCase()
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'

  // placeholders
  const subscriptionStatus = 'À configurer'

  if (loading) {
    return (
      <main className="page-wrap" style={wrapperStyle}>
        <h1 className="page-title">ESPACE CLIENT</h1>
        <section className="panel" style={{ ...Soft, padding:20 }}>
          <p style={{ color:'#fff', opacity:.8 }}>Chargement…</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap" style={wrapperStyle}>
      {/* ONGLET "ME DÉCONNECTER" — en haut à droite, blanc / texte bordeaux */}
      <button
        onClick={handleSignOut}
        style={{
          position:'fixed', top:16, right:16, zIndex:50,
          background:'#ffffff', color:ACCENT, fontWeight:800,
          border:'none', borderRadius:999, padding:'10px 16px',
          boxShadow:'0 8px 24px rgba(0,0,0,0.15)', cursor:'pointer'
        }}
        aria-label="Me déconnecter"
      >
        Me déconnecter
      </button>

      {/* HERO : Titre gauche / Carte membre droite */}
      <div
        style={{
          display:'grid',
          gridTemplateColumns:'minmax(280px, 1fr) 340px',
          gap:22,
          alignItems:'stretch',
          marginBottom:22
        }}
      >
        <div>
          <h1 className="page-title" style={{ lineHeight:1.05, marginBottom:10 }}>
            Bienvenue sur<br/>votre compte <span style={{ color:'#fff', background:'#ffffff22', padding:'0 6px', borderRadius:8 }}>JurisCorrect</span>
          </h1>
          <p style={{ color:'#fff', opacity:.88, maxWidth:640 }}>
            Ravie de vous revoir <strong>{user?.email}</strong>. Retrouvez vos corrections et gérez votre abonnement en un seul endroit.
          </p>
        </div>

        {/* Carte membre — titre remonté et espacé, pas d’ID membre */}
        <div style={{ ...Soft, padding:18, boxShadow:'0 10px 30px rgba(0,0,0,0.15)', display:'grid', gridTemplateRows:'auto 1fr', gap:12 }}>
          {/* Titre un peu plus haut, bien séparé */}
          <div style={{ fontWeight:900, color:'#fff', letterSpacing:.2, marginTop:2 }}>
            Votre carte-membre
          </div>

          {/* Contenu carte */}
          <div
            style={{
              background:`linear-gradient(135deg, ${ACCENT}, #a43a57)`,
              borderRadius:14,
              padding:16,
              color:'#fff',
              display:'grid',
              alignContent:'space-between',
              gap:10,
              minHeight:110
            }}
          >
            <div style={{ fontSize:12, opacity:.95 }}>Titulaire</div>
            <div style={{ fontWeight:800, fontSize:16 }}>{user?.email}</div>
            <div style={{ fontSize:12, opacity:.9 }}>Membre depuis le {createdAt}</div>
          </div>
        </div>
      </div>

      {/* Alerte ENV uniquement si nécessaire (pas de bordure blanche) */}
      {!envOk && (
        <div style={{
          margin:'0 0 16px', padding:12, borderRadius:12, fontWeight:700,
          color:'#ff6b6b', background:'rgba(255,107,107,0.12)'
        }}>
          Variables Supabase absentes côté client. Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel (Preview + Prod), puis redeploie.
        </div>
      )}

      {/* VOTRE ESPACE PERSONNEL : seulement 2 tuiles */}
      <h2 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:'6px 0 12px' }}>Votre espace personnel</h2>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:14 }}>
        {/* Tuile : Historique de corrections */}
        <a href="/correction-complete" style={{ ...Tile }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>
            Historique de corrections
          </div>
          <div style={{ color:'#fff', opacity:.85, fontSize:14, minHeight:40 }}>
            Consultez toutes vos corrections et reçus en un seul endroit.
          </div>
          <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#ffffff', color:ACCENT, display:'grid', placeItems:'center', fontWeight:900 }}>
              →
            </div>
          </div>
        </a>

        {/* Tuile : Abonnement */}
        <a href="#" onClick={(e)=>e.preventDefault()} style={{ ...Tile }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>
            Abonnement
          </div>
          <div style={{ color:'#fff', opacity:.85, fontSize:14, minHeight:40 }}>
            Gérer l’offre, le moyen de paiement et l’annulation via le portail Stripe.
          </div>
          <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ padding:'6px 10px', borderRadius:999, fontSize:12, fontWeight:800,
              color:'#f1c40f', background:'rgba(241,196,15,0.12)' }}>
              {subscriptionStatus}
            </span>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#ffffff', color:ACCENT, display:'grid', placeItems:'center', fontWeight:900 }}>
              →
            </div>
          </div>
        </a>
      </div>

      {/* TOAST discrêt si message */}
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
