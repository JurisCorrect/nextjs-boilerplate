'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()

  // ✅ JS pur (pas de "as string")
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // Affiche un message clair si les env vars manquent
    if (!url || !key) {
      console.warn('Supabase env vars manquantes. Ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans Vercel.')
    }
    return createClient(url || '', key || '')
  }, [])

  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'ok'|'err', text: string }

  // Champs login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Champs register
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  useEffect(() => {
    if (search?.get('email_confirmed') === '1') {
      setTab('login')
      setMsg({ type: 'ok', text: 'Email confirmé ✅ Vous pouvez maintenant vous connecter.' })
    }
  }, [search])

  async function handleLogin(e) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      })
      if (error) throw error
      router.push('/correction-complete')
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || 'Erreur de connexion' })
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setMsg(null)

    if (regPassword !== regConfirm) {
      setMsg({ type: 'err', text: 'Mot de passe différent' })
      return
    }
    if (regPassword.length < 8) {
      setMsg({ type: 'err', text: 'Le mot de passe doit contenir au moins 8 caractères' })
      return
    }

    setBusy(true)
    try {
      const emailRedirectTo = `${window.location.origin}/login?email_confirmed=1`
      const { error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: { emailRedirectTo }
      })
      if (error) throw error

      setMsg({
        type: 'ok',
        text: "Compte créé 🎉 Vérifiez votre boîte mail et cliquez sur le lien de confirmation."
      })
      setRegEmail('')
      setRegPassword('')
      setRegConfirm('')
      setTab('login')
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || "Erreur lors de l'inscription" })
    } finally {
      setBusy(false)
    }
  }

  function Notice() {
    if (!msg) return null
    const styleBase = {
      marginTop: 14,
      padding: 12,
      borderRadius: 8,
      fontWeight: 600,
      textAlign: 'center'
    }
    const style =
      msg.type === 'ok'
        ? { ...styleBase, color: '#2ed573', background: 'rgba(46,213,115,0.12)' }
        : { ...styleBase, color: '#ff6b6b', background: 'rgba(255,107,107,0.12)' }
    return <div style={style}>{msg.text}</div>
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CONNEXION / INSCRIPTION</h1>

      {/* Onglets (même style que ton site) */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
        <button
          type="button"
          onClick={() => setTab('login')}
          style={{
            background: tab === 'login' ? '#ffffff' : 'rgba(255,255,255,0.3)',
            color: tab === 'login' ? '#7b1e3a' : '#ffffff',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px 0 0 8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 16
          }}
        >
          Se connecter
        </button>
        <button
          type="button"
          onClick={() => setTab('register')}
          style={{
            background: tab === 'register' ? '#ffffff' : 'rgba(255,255,255,0.3)',
            color: tab === 'register' ? '#7b1e3a' : '#ffffff',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 16
          }}
        >
          Créer un compte
        </button>
      </div>

      <section className="panel">
        {/* Connexion */}
        {tab === 'login' && (
          <form className="form" onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Mot de passe</label>
              <input
                id="login-password"
                type="password"
                className="input"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Votre mot de passe"
              />
            </div>
            <div className="actions">
              <button type="submit" className="btn-send" disabled={busy}>
                {busy ? 'Connexion…' : 'SE CONNECTER'}
              </button>
            </div>
            <Notice />
          </form>
        )}

        {/* Inscription */}
        {tab === 'register' && (
          <form className="form" onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                className="input"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="reg-password">Mot de passe</label>
              <input
                id="reg-password"
                type="password"
                className="input"
                required
                minLength={8}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
              />
            </div>
            <div className="field">
              <label htmlFor="reg-confirm">Confirmer le mot de passe</label>
              <input
                id="reg-confirm"
                type="password"
                className="input"
                required
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Retapez votre mot de passe"
              />
            </div>
            <div className="actions">
              <button type="submit" className="btn-send" disabled={busy}>
                {busy ? 'Création…' : 'CRÉER MON COMPTE'}
              </button>
            </div>
            <Notice />
          </form>
        )}
      </section>
    </main>
  )
}
