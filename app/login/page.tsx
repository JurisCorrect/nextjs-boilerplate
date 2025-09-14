'use client'

import { useEffect, useState } from 'react'
import { ForgotPasswordInline } from '@/components/ForgotPasswordInline'

type Msg = { type: 'ok' | 'err'; text: string }

export default function LoginPage() {
  // --- états ---
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<Msg | null>(null)

  // Champs login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Champs register
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  // ENV client
  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  // Garde SSR
  if (typeof window === 'undefined') {
    return (
      <main className="page-wrap">
        <h1 className="page-title">CONNEXION / INSCRIPTION</h1>
        <section className="panel">
          <p style={{ color: '#fff', opacity: 0.8 }}>Chargement…</p>
        </section>
      </main>
    )
  }

  // Affiche "Email confirmé" au retour du lien Supabase
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('email_confirmed') === '1') {
        setTab('login')
        setMsg({ type: 'ok', text: 'Email confirmé ✅ Vous pouvez maintenant vous connecter.' })
        window.history.replaceState(null, '', window.location.pathname)
      }
    } catch {}
  }, [])

  function Notice() {
    if (!msg) return null
    const base: React.CSSProperties = {
      marginTop: 14,
      padding: 12,
      borderRadius: 8,
      fontWeight: 600,
      textAlign: 'center',
    }
    const style =
      msg.type === 'ok'
        ? { ...base, color: '#2ed573', background: 'rgba(46,213,115,0.12)' }
        : { ...base, color: '#ff6b6b', background: 'rgba(255,107,107,0.12)' }
    return <div style={style}>{msg.text}</div>
  }

  // Supabase helper
  async function getSupabaseOrFail() {
    const { createClient } = await import('@supabase/supabase-js')
    if (!ENV_URL || !ENV_KEY) {
      throw new Error(
        "Configuration Supabase manquante.\n" +
          "Vercel → Project → Settings → Environment Variables :\n" +
          "• NEXT_PUBLIC_SUPABASE_URL\n" +
          "• NEXT_PUBLIC_SUPABASE_ANON_KEY\n" +
          "Puis redeploie."
      )
    }
    return createClient(ENV_URL, ENV_KEY)
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      const supabase = await getSupabaseOrFail()
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      })
      if (error) throw error
      window.location.href = '/espace-client'
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.message || 'Erreur de connexion' })
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
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
      const supabase = await getSupabaseOrFail()
      const emailRedirectTo = `${window.location.origin}/login?email_confirmed=1`
      const { error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: { emailRedirectTo },
      })
      if (error) throw error

      setMsg({
        type: 'ok',
        text:
          'Compte créé 🎉 Vérifiez votre boîte mail et cliquez sur le lien de confirmation. ' +
          'Vous serez redirigé(e) vers la page de connexion.',
      })
      setRegEmail('')
      setRegPassword('')
      setRegConfirm('')
      setTab('login')
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.message || "Erreur lors de l'inscription" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CONNEXION / INSCRIPTION</h1>

      {/* Alerte ENV si manquantes */}
      {!envOk && (
        <div
          style={{
            margin: '12px 0 0',
            padding: 12,
            borderRadius: 8,
            fontWeight: 600,
            textAlign: 'center',
            color: '#ff6b6b',
            background: 'rgba(255,107,107,0.12)',
          }}
        >
          Variables Supabase absentes côté client.
          <br />
          Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel (Production + Preview),
          puis redeploie avec "Clear build cache".
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: 30 }}>
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
            fontSize: 16,
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
            fontSize: 16,
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
              <button type="submit" className="btn-send" disabled={busy || !envOk}>
                {busy ? 'Connexion…' : 'SE CONNECTER'}
              </button>
            </div>

            {/* Mot de passe oublié inline — on passe l’email saisi */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <ForgotPasswordInline emailFromLogin={loginEmail} />
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
              <button type="submit" className="btn-send" disabled={busy || !envOk}>
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
