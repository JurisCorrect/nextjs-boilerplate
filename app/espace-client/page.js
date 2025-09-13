'use client'

import { useEffect, useState } from 'react'

export default function EspaceClientPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null) // {type: 'ok'|'err', text}

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        const supabase = createClient(url, key)

        const { data } = await supabase.auth.getUser()
        if (!mounted) return

        if (!data?.user) {
          // Pas connecté → retourne au login
          window.location.href = '/login'
          return
        }

        setUser(data.user)
        setLoading(false)

        // Si l’utilisateur se déconnecte dans un autre onglet
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
          if (!session) window.location.href = '/login'
        })
        // cleanup
        return () => sub?.subscription?.unsubscribe?.()
      } catch (err) {
        setMsg({ type: 'err', text: "Erreur d'initialisation" })
        setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  async function handleSignOut() {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      const supabase = createClient(url, key)
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (e) {
      setMsg({ type: 'err', text: 'Déconnexion impossible' })
    }
  }

  if (loading) {
    return (
      <main className="page-wrap">
        <h1 className="page-title">ESPACE CLIENT</h1>
        <section className="panel">
          <p style={{ color: '#fff', opacity: .8 }}>Chargement…</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">ESPACE CLIENT</h1>

      {msg && (
        <div style={{
          margin: '12px 0', padding: 12, borderRadius: 8, fontWeight: 600, textAlign: 'center',
          color: msg.type === 'ok' ? '#2ed573' : '#ff6b6b',
          background: msg.type === 'ok' ? 'rgba(46,213,115,0.12)' : 'rgba(255,107,107,0.12)'
        }}>
          {msg.text}
        </div>
      )}

      {/* Profil */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', marginBottom: 12 }}>Mon profil</h2>
        <div className="field">
          <label>Email</label>
          <input className="input" value={user?.email || ''} readOnly />
        </div>
        <div className="actions" style={{ marginTop: 16 }}>
          <button className="btn-send" onClick={handleSignOut}>ME DÉCONNECTER</button>
        </div>
      </section>

      {/* Abonnement */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', marginBottom: 12 }}>Mon abonnement</h2>
        <p style={{ color: '#fff', opacity: .9, marginBottom: 12 }}>
          Gérez votre abonnement (changement d’offre, annulation, carte bancaire).
        </p>
        {/* ⚠ Nécessite une route serveur Stripe pour créer une session de portail.
            En attendant, on met un placeholder non bloquant. */}
        <button className="btn-send" disabled title="Bientôt disponible">
          GÉRER MON ABONNEMENT (bientôt)
        </button>
      </section>

      {/* Corrections */}
      <section className="panel">
        <h2 style={{ color: '#fff', marginBottom: 12 }}>Mes corrections</h2>
        <p style={{ color: '#fff', opacity: .9, marginBottom: 12 }}>
          Retrouvez ici toutes vos corrections achetées.
        </p>

        {/* Placeholder : à connecter plus tard à ta base de données / Stripe */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
          gap: 16
        }}>
          <article style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: '#fff', marginBottom: 6 }}>Dissertation – Exemple</h3>
            <p style={{ color: '#fff', opacity: .8, fontSize: 14 }}>Achetée le 12/09/2025</p>
            <div className="actions" style={{ marginTop: 10 }}>
              <a className="btn-send" href="/correction-complete">VOIR LA CORRECTION</a>
            </div>
          </article>

          <article style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: '#fff', marginBottom: 6 }}>Cas pratique – Exemple</h3>
            <p style={{ color: '#fff', opacity: .8, fontSize: 14 }}>Acheté le 05/09/2025</p>
            <div className="actions" style={{ marginTop: 10 }}>
              <a className="btn-send" href="/correction-complete">VOIR LA CORRECTION</a>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
