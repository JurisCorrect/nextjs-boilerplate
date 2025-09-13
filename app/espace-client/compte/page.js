'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function ComptePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [newPwd, setNewPwd] = useState('')
  const [notif, setNotif] = useState(true) // placeholder local

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  if (typeof window === 'undefined') return <main style={{ background:'#fff', minHeight:'100vh' }} />

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

  async function updatePassword(e) {
    e.preventDefault()
    setMsg(null)
    if (newPwd.length < 8) { setMsg({ type:'err', text:'Le mot de passe doit contenir au moins 8 caractères' }); return }
    try {
      const s = await getSupabase()
      const { error } = await s.auth.updateUser({ password: newPwd })
      if (error) throw error
      setNewPwd('')
      setMsg({ type:'ok', text:'Mot de passe mis à jour ✅' })
    } catch (e) { setMsg({ type:'err', text:e.message || 'Erreur' }) }
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
            Gérez votre email de connexion, mot de passe et préférences de notification.
          </p>
        </section>
      </div>

      <div className="container" style={{ padding:'18px 16px 44px' }}>
        {/* Email de connexion (lecture seule) */}
        <section style={{ ...card, marginBottom:18 }}>
          <h3 style={{ color:BRAND, fontSize:18, fontWeight:900, margin:'0 0 10px' }}>Email de connexion</h3>
          <input className="input" value={user?.email || ''} readOnly
                 style={{ width:'100%', background:'#fff', border:'1px solid rgba(0,0,0,.12)', color:'#222' }} />
          <p style={{ color:MUTED, marginTop:8, fontSize:13 }}>
            Pour changer d’email, contactez le support.
          </p>
        </section>

        {/* Changer le mot de passe */}
        <section style={{ ...card, marginBottom:18 }}>
          <h3 style={{ color:BRAND, fontSize:18, fontWeight:900, margin:'0 0 10px' }}>Changer le mot de passe</h3>
          <form onSubmit={updatePassword} className="form">
            <div className="field" style={{ marginBottom:10 }}>
              <label style={{ color:'#222', fontWeight:700 }}>Nouveau mot de passe</label>
              <input className="input" type="password" required minLength={8}
                     value={newPwd} onChange={e=>setNewPwd(e.target.value)}
                     placeholder="Minimum 8 caractères"
                     style={{ width:'100%', background:'#fff', border:'1px solid rgba(0,0,0,.12)', color:'#222' }} />
            </div>
            <div className="actions">
              <button className="btn-send" type="submit" style={cta}>Mettre à jour</button>
            </div>
          </form>
        </section>

        {/* Préférences de notification (placeholder) */}
        <section style={{ ...card }}>
          <h3 style={{ color:BRAND, fontSize:18, fontWeight:900, margin:'0 0 10px' }}>Préférences de notification</h3>
          <label style={{ color:'#222', display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={notif} onChange={()=>setNotif(!notif)} />
            Recevoir un email quand une correction est prête
          </label>
          <p style={{ color:MUTED, marginTop:8, fontSize:13 }}>
            (Placeholder — à brancher à ta base plus tard)
          </p>
        </section>

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
          background: msg.type==='ok' ? 'rgba(46,125,50,0.12)' : 'rgba(183,28,28,0.12)',
          color: msg.type==='ok' ? '#2e7d32' : '#b71c1c', fontWeight:700
        }}>{msg.text}</div>
      )}
    </main>
  )
}
