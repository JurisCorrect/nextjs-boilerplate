'use client'

import { useState, useMemo } from 'react'

export default function CheckoutAccountBlock({
  apiPath = '/api/checkout', // ← adapte si ton endpoint est différent
  payload = {},              // ← données produit (ex: {product: 'dissertation'})
  successUrl = '/correction-complete',
  cancelUrl = '/login',
}) {
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [create, setCreate] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  const getSupabase = useMemo(() => async () => {
    const { createClient } = await import('@supabase/supabase-js')
    if (!envOk) throw new Error('Variables Supabase manquantes')
    return createClient(ENV_URL, ENV_KEY)
  }, [ENV_URL, ENV_KEY, envOk])

  async function maybeCreateAccount() {
    if (!create) return true
    if (!envOk) { setMsg({type:'err', text:'Config Supabase manquante'}); return false }
    if (pwd.length < 8) { setMsg({type:'err', text:'Mot de passe ≥ 8 caractères'}); return false }
    if (pwd !== pwd2) { setMsg({type:'err', text:'Mot de passe différent'}); return false }

    try {
      const s = await getSupabase()
      const emailRedirectTo = `${window.location.origin}/login?email_confirmed=1`
      const { error } = await s.auth.signUp({ email: email.trim(), password: pwd, options: { emailRedirectTo } })
      // Si l'utilisateur existe déjà, on continue quand même vers le paiement
      if (error && !/registered|exists/i.test(error.message)) {
        setMsg({ type:'err', text: error.message })
        return false
      }
      return true
    } catch (e) {
      setMsg({ type:'err', text: e.message || 'Erreur création de compte' })
      return false
    }
  }

  async function startCheckout(e) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)

    try {
      const ok = await maybeCreateAccount()
      if (!ok) { setBusy(false); return }

      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          customer_email: email.trim(),
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      })
      if (!res.ok) throw new Error('Échec création session de paiement')
      const data = await res.json()
      if (!data?.url) throw new Error('URL de paiement introuvable')
      window.location.href = data.url
    } catch (err) {
      setMsg({ type:'err', text: err.message || 'Erreur paiement' })
      setBusy(false)
    }
  }

  const BRAND = 'var(--brand)'
  const BRAND2 = 'var(--brand-2)'
  const MUTED = 'var(--muted)'

  const card = {
    background:'#fff', borderRadius:16,
    padding:'clamp(18px,2.4vw,26px)',
    boxShadow:'0 10px 30px rgba(0,0,0,.08)', border:'1px solid rgba(0,0,0,.04)'
  }
  const cta = {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'12px 18px', borderRadius:14, fontWeight:800,
    background:`linear-gradient(180deg, ${BRAND} 0%, ${BRAND2} 100%)`,
    color:'#fff', border:'none', cursor:'pointer', textDecoration:'none',
    boxShadow:'0 12px 30px rgba(123,30,58,.35)'
  }

  return (
    <section style={{ ...card }}>
      <h3 style={{ color:BRAND, fontWeight:900, marginTop:0, marginBottom:8 }}>
        Paiement & création de compte
      </h3>
      <p style={{ color:MUTED, marginTop:0 }}>
        Utilisez votre email pour le paiement. Vous pouvez créer votre compte en même temps pour retrouver vos corrections.
      </p>

      <form onSubmit={startCheckout} className="form">
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" required value={email}
                 onChange={e=>setEmail(e.target.value)} placeholder="vous@email.com" />
        </div>

        <label style={{ display:'flex', alignItems:'center', gap:8, margin:'8px 0 6px', color:'#222' }}>
          <input type="checkbox" checked={create} onChange={()=>setCreate(!create)} />
          Créer un compte maintenant
        </label>

        {create && (
          <>
            <div className="field">
              <label>Mot de passe</label>
              <input className="input" type="password" minLength={8} required value={pwd}
                     onChange={e=>setPwd(e.target.value)} placeholder="Minimum 8 caractères" />
            </div>
            <div className="field">
              <label>Confirmer le mot de passe</label>
              <input className="input" type="password" required value={pwd2}
                     onChange={e=>setPwd2(e.target.value)} placeholder="Retapez votre mot de passe" />
            </div>
          </>
        )}

        <div className="actions" style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button type="submit" className="btn-send" style={cta} disabled={busy}>
            {busy ? 'Redirection vers le paiement…' : 'Débloquer ma correction'}
          </button>
        </div>

        {msg && (
          <div style={{
            marginTop:12, padding:'10px 12px', borderRadius:10, fontWeight:700,
            color: msg.type==='err' ? '#b71c1c' : '#2e7d32',
            background: msg.type==='err' ? 'rgba(183,28,28,0.12)' : 'rgba(46,125,50,0.12)'
          }}>
            {msg.text}
          </div>
        )}
      </form>
    </section>
  )
}
