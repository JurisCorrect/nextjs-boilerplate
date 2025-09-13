'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function EspaceClientHome() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)

  // ENV
  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  // --- SSR guard ---
  if (typeof window === 'undefined') {
    return (
      <main style={{ background:'#fff', minHeight:'100vh' }}>
        <div className="container">
          <h1 style={{ color:'var(--brand)', fontWeight:900, padding:'24px 0' }}>Espace client</h1>
        </div>
      </main>
    )
  }

  // Supabase lazy
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
        setUser(data.user)
        setLoading(false)
        const { data: sub } = s.auth.onAuthStateChange((_e, session) => { if (!session) window.location.href = '/login' })
        return () => sub?.subscription?.unsubscribe?.()
      } catch (e) {
        setMsg({ type:'err', text: e.message || "Erreur d'initialisation" })
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  async function handleSignOut() {
    try { const s = await getSupabase(); await s.auth.signOut(); window.location.href = '/login' }
    catch { setMsg({ type:'err', text:'Déconnexion impossible' }) }
  }

  // === Design tokens (alignés à ta home) ===
  const BRAND = 'var(--brand)'
  const BRAND2 = 'var(--brand-2)'
  const MUTED = 'var(--muted)'

  const cta = {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'10px 16px', borderRadius:14, fontWeight:800,
    background:'linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)',
    color:'#fff', border:'none', boxShadow:'0 12px 30px rgba(123,30,58,.35)', cursor:'pointer', textDecoration:'none'
  }

  const card = {
    background:'#fff',
    borderRadius:16,
    padding:'clamp(18px, 2.4vw, 26px)',
    boxShadow:'0 10px 30px rgba(0,0,0,.08)',
    border:'1px solid rgba(0,0,0,.04)'
  }

  const tile = {
    ...card,
    padding:'clamp(18px, 2vw, 24px)',
    display:'block',
    textDecoration:'none'
  }

  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'

  if (loading) {
    return (
      <main style={{ background:'#fff', minHeight:'100vh' }}>
        {/* fond blanc forcé pleine page */}
        <div style={{ position:'fixed', inset:0, background:'#fff', zIndex:0 }} />
        <div className="container" style={{ padding:'24px 16px', position:'relative', zIndex:1 }}>
          <section style={card}>Chargement…</section>
        </div>
      </main>
    )
  }

  return (
    <main style={{ background:'#fff', minHeight:'100vh' }}>
      {/* fond blanc plein écran (écrase tout fond bordeaux global) */}
      <div style={{ position:'fixed', inset:0, background:'#fff', zIndex:0 }} />

      {/* Onglet déconnexion (comme ton CTA “Se connecter”) */}
      <button
        onClick={handleSignOut}
        style={{ position:'fixed', top:16, right:16, zIndex:3, ...cta }}
        aria-label="Me déconnecter"
      >
        Me déconnecter
      </button>

      {/* Contenu sur calque au-dessus du fond blanc */}
      <div style={{ position:'relative', zIndex:1 }}>
        {/* HERO */}
        <div className="container" style={{ padding:'20px 16px 0' }}>
          <section style={{ ...card, marginInline:'auto' }}>
            <h1 style={{ color:BRAND, fontWeight:900, margin:'0 0 8px', lineHeight:1.05 }}>
              Bienvenue sur votre compte JurisCorrect
            </h1>
            <p style={{ color:MUTED, margin:0 }}>
              Ravie de vous revoir <strong style={{ color:'#222' }}>{user?.email}</strong>. Retrouvez vos corrections,
              gérez votre abonnement et vos informations de compte en un seul endroit.
              <br/>
              <span style={{ color:'rgba(0,0,0,.55)', fontSize:13 }}>Membre depuis le {createdAt}</span>
            </p>
          </section>
        </div>

        {/* Grille avec gros espacements et “Mon compte” en dessous */}
        <div className="container" style={{ padding:'22px 16px 44px' }}>
          <h2 style={{ color:BRAND, fontSize:22, fontWeight:900, margin:'18px 0 14px' }}>
            Votre espace personnel
          </h2>

          {/* Ligne 1 : 2 colonnes espacées */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(2, minmax(320px, 1fr))',
            gap:24
          }}>
            {/* Mes corrections */}
            <Link href="/espace-client/corrections" style={tile}>
              <div style={{ color:BRAND, fontWeight:900, marginBottom:6 }}>Mes corrections</div>
              <ul style={{ color:MUTED, fontSize:14, lineHeight:1.6, margin:'0 0 12px 18px' }}>
                <li>Historique complet des corrections passées</li>
                <li>Date de soumission</li>
                <li>Téléchargement PDF des corrections</li>
              </ul>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{
                  width:38, height:38, borderRadius:999,
                  background:`linear-gradient(180deg, ${BRAND} 0%, ${BRAND2} 100%)`,
                  color:'#fff', display:'grid', placeItems:'center', fontWeight:900
                }}>→</div>
              </div>
            </Link>

            {/* Gestion de l’abonnement */}
            <Link href="/espace-client/abonnement" style={tile}>
              <div style={{ color:BRAND, fontWeight:900, marginBottom:6 }}>Gestion de l’abonnement</div>
              <ul style={{ color:MUTED, fontSize:14, lineHeight:1.6, margin:'0 0 12px 18px' }}>
                <li>Plan actuel (5€ ponctuel ou 12,99€/mois)</li>
                <li>Prochaine date de facturation</li>
                <li>Historique des paiements</li>
                <li>Changer de plan / Résilier</li>
                <li>Portail client Stripe</li>
              </ul>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{
                  width:38, height:38, borderRadius:999,
                  background:`linear-gradient(180deg, ${BRAND} 0%, ${BRAND2} 100%)`,
                  color:'#fff', display:'grid', placeItems:'center', fontWeight:900
                }}>→</div>
              </div>
            </Link>
          </div>

          {/* Ligne 2 : Mon compte en pleine largeur (rappel de la home) */}
          <div style={{ marginTop:24 }}>
            <Link href="/espace-client/compte" style={tile}>
              <div style={{ color:BRAND, fontWeight:900, marginBottom:6 }}>Mon compte</div>
              <ul style={{ color:MUTED, fontSize:14, lineHeight:1.6, margin:'0 0 12px 18px' }}>
                <li>Email de connexion</li>
                <li>Changer le mot de passe</li>
                <li>Préférences de notification email</li>
              </ul>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <div style={{
                  width:38, height:38, borderRadius:999,
                  background:`linear-gradient(180deg, ${BRAND} 0%, ${BRAND2} 100%)`,
                  color:'#fff', display:'grid', placeItems:'center', fontWeight:900
                }}>→</div>
              </div>
            </Link>
          </div>

          {/* Support */}
          <p style={{ color:MUTED, margin:'26px 0 0' }}>
            Besoin d’aide ? Écrivez-nous :{' '}
            <a href="mailto:marie.terki@icloud.com" style={{ color:BRAND, fontWeight:700, textDecoration:'underline', textUnderlineOffset:4 }}>
              marie.terki@icloud.com
            </a>
          </p>
        </div>
      </div>

      {/* Toast éventuel */}
      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:4,
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
