'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function ComptePage() {
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // {type:'ok'|'err', text:string}
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  // client-only guard
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
        setUser(data.user)
      } catch (e) {
        setMsg({ type:'err', text: e?.message || 'Erreur chargement compte' })
      }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  async function handleChangePassword(e) {
    e.preventDefault()
    setMsg(null)

    if (pwd1.length < 8) { setMsg({ type:'err', text:'Mot de passe ≥ 8 caractères' }); return }
    if (pwd1 !== pwd2)   { setMsg({ type:'err', text:'Mot de passe différent' }); return }

    setBusy(true)
    try {
      const s = await getSupabase()
      const { error } = await s.auth.updateUser({ password: pwd1 })
      if (error) throw error
      setMsg({ type:'ok', text:'Mot de passe mis à jour ✅' })
      setPwd1(''); setPwd2('')
    } catch (err) {
      setMsg({ type:'err', text: err?.message || 'Erreur lors de la mise à jour' })
    } finally {
      setBusy(false)
    }
  }

  // tokens style (alignés à ta home)
  const BRAND = 'var(--brand)'
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

  return (
    <main style={{ background:'#fff', minHeight:'100vh' }}>
      <div className="container" style={{ padding:'20px 16px 0' }}>
        <section style={{ ...card, marginInline:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <h1 style={{ color:BRAND, fontWeight:900, margin:0, lineHeight:1.05 }}>Mon compte</h1>
            <Link href="/espace-client" style={cta}>← Retour</Link>
          </div>
          <p style={{ color:MUTED, margin:'8px 0 0' }}>
            Gérez votre email de connexion et votre mot de passe.
          </p>
        </section>
      </div>

      <div className="container" style={{ padding:'18px 16px 44px', display:'grid', gap:18, gridTemplateColumns:'1fr', maxWidth:980, margin:'0 auto' }}>
        {/* Email (lecture seule) */}
        <section style={{ ...card }}>
          <h3 style={{ color:BRAND, fontWeight:900, marginTop:0, marginBottom:14 }}>Email de connexion</h3>
          <div className="field" style={{ margin:0 }}>
            <label htmlFor="email">Adresse email</label>
            <input id="email" className="input" type="email" value={user?.email || ''} readOnly />
          </div>
          <p style={{ color:MUTED, marginTop:10 }}>Pour modifier l’email, contactez-nous : <a href="mailto:marie.terki@icloud.com" style={{ color:BRAND, fontWeight:700 }}>marie.terki@icloud.com</a></p>
        </section>

        {/* Changer mot de passe */}
        <section style={{ ...card }}>
          <h3 style={{ color:BRAND, fontWeight:900, marginTop:0, marginBottom:14 }}>Changer le mot de passe</h3>
          <form className="form" onSubmit={handleChangePassword} noValidate>
            <div className="field">
              <label htmlFor="pwd1">Nouveau mot de passe</label>
              <input id="pwd1" className="input" type="password" minLength={8} value={pwd1} onChange={(e)=>setPwd1(e.target.value)} placeholder="Minimum 8 caractères" required />
            </div>
            <div className="field">
              <label htmlFor="pwd2">Confirmer le mot de passe</label>
              <input id="pwd2" className="input" type="password" value={pwd2} onChange={(e)=>setPwd2(e.target.value)} placeholder="Retapez le mot de passe" required />
            </div>
            <div className="actions">
              <button type="submit" className="btn-send" disabled={busy}>
                {busy ? 'Mise à jour…' : 'ENREGISTRER'}
              </button>
            </div>
          </form>
        </section>

        {/* ✅ Section "Préférences de notification" SUPPRIMÉE */}
      </div>

      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:10,
          padding:'10px 14px', borderRadius:12,
          background: msg.type==='ok' ? 'rgba(46,125,50,0.12)' : 'rgba(183,28,28,0.12)',
          color: msg.type==='ok' ? '#2e7d32' : '#b71c1c', fontWeight:700
        }}>{msg.text}</div>
      )}

      {!envOk && (
        <div style={{ maxWidth:980, margin:'10px auto', color:'#b71c1c' }}>
          Variables Supabase absentes. Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel.
        </div>
      )}
    </main>
  )
}
