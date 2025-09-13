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

  // ---- DESIGN TOKENS ----
  const ACCENT = '#7b1e3a' // ta couleur de marque
  const Glass = { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16 }
  const Soft = { background:'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))', borderRadius:20, border:'1px solid rgba(255,255,255,0.08)' }
  const Tile = { background:'#fafafa0f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:18 }
  const LinkLike = { color:'#fff', fontWeight:800, textDecoration:'underline', textDecorationThickness:2, textUnderlineOffset:4 }

  const initials = (user?.email || 'U').slice(0,1).toUpperCase()
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'

  // ---- PLACEHOLDERS (à brancher plus tard) ----
  const subscriptionStatus = 'A configurer' // ex: 'Actif' / 'Inactif'
  const mockCorrections = [
    { id:'1', title:'Dissertation', date:'12/09/2025', status:'Corrigée' },
    { id:'2', title:'Cas pratique', date:'05/09/2025', status:'Corrigé' },
    { id:'3', title:'Commentaire', date:'29/08/2025', status:'En attente' },
  ]

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
    <main className="page-wrap" style={{ maxWidth:1120, margin:'0 auto' }}>
      {/* BARRE ACTIONS (en haut à droite) */}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginBottom:8 }}>
        <button onClick={handleSignOut} className="btn-send" style={{ background:'#fff', color:ACCENT, border:'none' }}>
          ME DÉCONNECTER
        </button>
      </div>

      {/* HERO : Titre à gauche / Carte à droite */}
      <div
        style={{
          display:'grid',
          gridTemplateColumns:'minmax(280px, 1fr) 320px',
          gap:20,
          alignItems:'center',
          marginBottom:18
        }}
      >
        <div>
          <h1 className="page-title" style={{ lineHeight:1.05, marginBottom:8 }}>
            Bienvenue sur<br/>votre compte <span style={{ color:'#fff', background:'#ffffff22', padding:'0 6px', borderRadius:8 }}>JurisCorrect</span>
          </h1>
          <p style={{ color:'#fff', opacity:.85, maxWidth:640 }}>
            Ravi de vous revoir <strong>{user?.email}</strong>. Retrouvez toutes vos corrections, gérez votre abonnement
            et vos informations de compte en un seul endroit.
          </p>
          <p style={{ marginTop:8 }}>
            <a href="#profil" style={{ ...LinkLike, color:'#ffffff' }}>Gérer le compte</a>
          </p>
        </div>

        {/* Carte “membre” à droite */}
        <div style={{ ...Soft, padding:18, height:160, display:'grid', gridTemplateRows:'auto 1fr auto', boxShadow:'0 10px 30px rgba(0,0,0,0.15)' }}>
          <div style={{ fontWeight:900, color:'#fff' }}>Votre carte membre</div>
          <div style={{
            background:`linear-gradient(135deg, ${ACCENT}, #a43a57)`,
            borderRadius:12, padding:14, color:'#fff', display:'grid', alignContent:'space-between'
          }}>
            <div style={{ fontSize:12, opacity:.9 }}>Titulaire</div>
            <div style={{ fontWeight:800, fontSize:16 }}>{user?.email}</div>
            <div style={{ fontSize:12, opacity:.85 }}>Depuis le {createdAt}</div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <span style={{ fontSize:12, color:'#fff', opacity:.7 }}>ID membre</span>
            <span style={{ fontWeight:800, color:'#fff' }}>•••• •••• ••••</span>
          </div>
        </div>
      </div>

      {/* Bandeau ENV si besoin */}
      {!envOk && (
        <div style={{ margin:'0 0 16px', padding:12, borderRadius:12, color:'#ff6b6b',
          background:'rgba(255,107,107,0.12)', border:'1px solid rgba(255,107,107,0.25)', fontWeight:700 }}>
          Variables Supabase absentes côté client. Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel (Preview + Prod), puis redeploie.
        </div>
      )}

      {/* SECTION : Votre espace personnel */}
      <h2 style={{ color:'#fff', fontSize:22, fontWeight:900, margin:'8px 0 10px' }}>Votre espace personnel</h2>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:14, marginBottom:18 }}>
        {/* Tuile 1 : Historique de corrections */}
        <a href="/correction-complete" style={{ ...Tile, textDecoration:'none' }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>Historique de corrections</div>
          <div style={{ color:'#fff', opacity:.8, fontSize:14, minHeight:40 }}>
            Consultez toutes vos corrections et reçus au même endroit.
          </div>
          <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#ffffff', color:ACCENT, display:'grid', placeItems:'center', fontWeight:900 }}>
              →
            </div>
          </div>
        </a>

        {/* Tuile 2 : Abonnement */}
        <a href="#" onClick={(e)=>e.preventDefault()} style={{ ...Tile, textDecoration:'none' }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>Abonnement</div>
          <div style={{ color:'#fff', opacity:.8, fontSize:14, minHeight:40 }}>
            Gérez l’offre, le moyen de paiement et l’annulation via le portail Stripe.
          </div>
          <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ padding:'6px 10px', borderRadius:999, color:'#f1c40f', background:'rgba(241,196,15,0.12)', fontWeight:800, fontSize:12 }}>
              {subscriptionStatus}
            </span>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#ffffff', color:ACCENT, display:'grid', placeItems:'center', fontWeight:900 }}>
              →
            </div>
          </div>
        </a>

        {/* Tuile 3 : Outils & documents */}
        <a href="/correction-complete" style={{ ...Tile, textDecoration:'none' }}>
          <div style={{ color:'#fff', fontWeight:900, marginBottom:6, textDecoration:'underline', textUnderlineOffset:4 }}>Outils & documents</div>
          <div style={{ color:'#fff', opacity:.8, fontSize:14, minHeight:40 }}>
            Accédez rapidement à vos documents, modèles et ressources utiles.
          </div>
          <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#ffffff', color:ACCENT, display:'grid', placeItems:'center', fontWeight:900 }}>
              →
            </div>
          </div>
        </a>
      </div>

      {/* SECTION : Mes corrections (aperçu) */}
      <section className="panel" style={{ ...Glass, padding:18, marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h3 style={{ color:'#fff', fontSize:18, fontWeight:900 }}>Mes corrections</h3>
          <a className="btn-send" href="/correction-complete" style={{ background:'#fff', color:ACCENT, border:'none' }}>TOUT VOIR</a>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12 }}>
          {mockCorrections.map((c)=>(
            <div key={c.id} style={{ ...Soft, padding:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ color:'#fff', fontWeight:800 }}>{c.title}</div>
                <span style={{
                  padding:'4px 8px', borderRadius:999, fontSize:12, fontWeight:800,
                  color: c.status.includes('attente') ? '#f1c40f' : '#2ed573',
                  background: c.status.includes('attente') ? 'rgba(241,196,15,0.12)' : 'rgba(46,213,115,0.12)'
                }}>{c.status}</span>
              </div>
              <div style={{ color:'#fff', opacity:.7, fontSize:13, marginBottom:10 }}>Achetée le {c.date}</div>
              <div style={{ display:'flex', gap:8 }}>
                <a className="btn-send" href="/correction-complete">VOIR</a>
                <button className="btn-send" style={{ background:'transparent', border:'1px dashed rgba(255,255,255,0.35)' }}>
                  TÉLÉCHARGER
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION : Profil */}
      <section id="profil" className="panel" style={{ ...Glass, padding:18 }}>
        <h3 style={{ color:'#fff', fontSize:18, fontWeight:900, marginBottom:10 }}>Mon profil</h3>
        <div className="field" style={{ marginBottom:10 }}>
          <label style={{ color:'#fff', opacity:.85 }}>Email</label>
          <input className="input" value={user?.email || ''} readOnly />
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:8 }}>
          <button className="btn-send" disabled style={{ opacity:.8 }} title="Bientôt">
            MODIFIER MON MOT DE PASSE
          </button>
          <button className="btn-send" onClick={handleSignOut} style={{ background:'#fff', color:ACCENT, border:'none' }}>
            ME DÉCONNECTER
          </button>
        </div>
      </section>

      {/* TOAST */}
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
