'use client'

import { useEffect, useMemo, useState } from 'react'

export default function EspaceClientPage() {
  // ---- STATE ----
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null) // {type:'ok'|'err', text:string}

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

  // ---- UI HELPERS ----
  const ACCENT = '#7b1e3a'
  const Glass = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }
  const Soft = { background:'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)' }
  const Chip = (text, tone='ok') => (
    <span style={{
      padding:'6px 10px', borderRadius:999, fontSize:12, fontWeight:700,
      color: tone==='ok' ? '#2ed573' : tone==='warn' ? '#f1c40f' : '#ff6b6b',
      background: tone==='ok' ? 'rgba(46,213,115,0.12)' : tone==='warn' ? 'rgba(241,196,15,0.12)' : 'rgba(255,107,107,0.12)'
    }}>{text}</span>
  )

  function Card({ children, style }) {
    return <div style={{ ...Soft, padding:16, ...style }}>{children}</div>
  }

  function Section({ title, right, children, style }) {
    return (
      <section className="panel" style={{ ...Glass, padding:20, ...style }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <h2 style={{ color:'#fff', fontSize:18, fontWeight:800, letterSpacing:.3 }}>{title}</h2>
          {right}
        </div>
        {children}
      </section>
    )
  }

  function Stat({ label, value, sub }) {
    return (
      <Card>
        <div style={{ color:'#fff', opacity:.8, fontSize:12, marginBottom:6 }}>{label}</div>
        <div style={{ color:'#fff', fontSize:22, fontWeight:800, marginBottom:4 }}>{value}</div>
        {sub && <div style={{ color:'#fff', opacity:.6, fontSize:12 }}>{sub}</div>}
      </Card>
    )
  }

  const initials = (user?.email || 'U').slice(0,1).toUpperCase()
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'

  // ---- PLACEHOLDERS (à brancher plus tard) ----
  const subscriptionStatus = 'Inconnu' // quand branché à Stripe: 'Actif' / 'Inactif'
  const subscriptionTone = 'warn'      // 'ok'|'warn'|'err'
  const totalCorrections = 2           // exemple
  const lastCorrection = '12/09/2025'  // exemple

  const mockCorrections = [
    { id: 'c1', type: 'Dissertation', date: '12/09/2025', status: 'Corrigée' },
    { id: 'c2', type: 'Cas pratique', date: '05/09/2025', status: 'Corrigé' },
    { id: 'c3', type: 'Commentaire', date: '29/08/2025', status: 'En attente' },
  ]

  // ---- RENDER ----
  if (loading) {
    return (
      <main className="page-wrap">
        <h1 className="page-title">ESPACE CLIENT</h1>
        <section className="panel" style={{ ...Glass, padding:20 }}>
          <p style={{ color:'#fff', opacity:.8 }}>Chargement…</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap">
      {/* HEADER MODERNE */}
      <div
        style={{
          ...Soft,
          padding:24,
          marginBottom:20,
          display:'grid',
          gridTemplateColumns:'auto 1fr auto',
          gap:16,
          alignItems:'center'
        }}
      >
        <div
          aria-hidden
          style={{
            width:56, height:56, borderRadius:'50%',
            display:'grid', placeItems:'center',
            background:'#fff',
            color:ACCENT, fontWeight:900, fontSize:22,
            boxShadow:'0 10px 30px rgba(0,0,0,0.15)'
          }}
        >
          {initials}
        </div>

        <div>
          <div style={{ color:'#fff', fontSize:18, fontWeight:800 }}>
            Bonjour {user?.email}
          </div>
          <div style={{ color:'#fff', opacity:.7, fontSize:13 }}>
            Membre depuis le {createdAt}
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={handleSignOut}
            className="btn-send"
            style={{ background:'#ffffff', color:ACCENT, border:'none' }}
          >
            ME DÉCONNECTER
          </button>
        </div>
      </div>

      {/* BANDEAU ENV (si manquantes) */}
      {!envOk && (
        <div
          style={{
            margin:'-8px 0 16px',
            padding:12,
            borderRadius:12,
            color:'#ff6b6b',
            background:'rgba(255,107,107,0.12)',
            border:'1px solid rgba(255,107,107,0.25)',
            fontWeight:700,
            textAlign:'center'
          }}
        >
          Variables Supabase absentes côté client.
          Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel (Preview + Prod), puis redeploie.
        </div>
      )}

      {/* STATS GRID */}
      <div
        style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',
          gap:14,
          marginBottom:20
        }}
      >
        <Stat label="Statut abonnement" value={<span>{Chip(subscriptionStatus, subscriptionTone)}</span>} sub="Via Stripe Customer Portal" />
        <Stat label="Corrections totales" value={totalCorrections} sub="Achetées sur votre compte" />
        <Stat label="Dernière correction" value={lastCorrection} sub="Mise à jour" />
      </div>

      {/* ABONNEMENT */}
      <Section
        title="Mon abonnement"
        right={
          <button
            className="btn-send"
            disabled
            title="Portail Stripe à brancher"
            style={{ opacity:.8 }}
          >
            GÉRER MON ABONNEMENT
          </button>
        }
        style={{ marginBottom:18 }}
      >
        <p style={{ color:'#fff', opacity:.85, margin:'6px 0 14px' }}>
          Gérer l’abonnement (changement d’offre, annulation, moyen de paiement) depuis le portail client Stripe.
        </p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <span>{Chip('Portail non connecté', 'warn')}</span>
          <span>{Chip('Sécurisé', 'ok')}</span>
        </div>
      </Section>

      {/* MES CORRECTIONS */}
      <Section
        title="Mes corrections"
        right={
          <a className="btn-send" href="/correction-complete" style={{ background:'#fff', color:ACCENT, border:'none' }}>
            VOIR LA DERNIÈRE
          </a>
        }
      >
        <div
          style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',
            gap:14
          }}
        >
          {mockCorrections.map((c) => (
            <Card key={c.id}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ color:'#fff', fontWeight:800 }}>{c.type}</div>
                {Chip(c.status, c.status.toLowerCase().includes('attente') ? 'warn' : 'ok')}
              </div>
              <div style={{ color:'#fff', opacity:.7, fontSize:13, marginBottom:10 }}>
                Achetée le {c.date}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <a className="btn-send" href="/correction-complete">VOIR</a>
                <button className="btn-send" style={{ background:'transparent', border:`1px dashed rgba(255,255,255,0.35)` }}>
                  TÉLÉCHARGER
                </button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* PROFIL */}
      <Section title="Mon profil" style={{ marginTop:18 }}>
        <div className="field" style={{ marginBottom:10 }}>
          <label style={{ color:'#fff', opacity:.85 }}>Email</label>
          <input className="input" value={user?.email || ''} readOnly />
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
          <button className="btn-send" disabled style={{ opacity:.8 }} title="Bientôt">
            MODIFIER MON MOT DE PASSE
          </button>
          <button className="btn-send" onClick={handleSignOut}>
            ME DÉCONNECTER
          </button>
        </div>
      </Section>

      {/* TOAST MESSAGE */}
      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:50,
          padding:'10px 14px', borderRadius:12, fontWeight:700,
          color: msg.type==='ok' ? '#2ed573' : '#ff6b6b',
          background: msg.type==='ok' ? 'rgba(46,213,115,0.12)' : 'rgba(255,107,107,0.12)',
          border:`1px solid ${msg.type==='ok' ? 'rgba(46,213,115,0.35)' : 'rgba(255,107,107,0.35)'}`
        }}>
          {msg.text}
        </div>
      )}
    </main>
  )
}
