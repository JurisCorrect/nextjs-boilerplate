'use client'

import { useEffect, useState } from 'react'

export default function LoginPage() {
  // --- états (déclarés avant tout usage) ---
  const [tab, setTab] = useState('login') // 'login' | 'register' | 'reset'
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { type: 'ok'|'err', text: string }

  // Champs login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Champs register
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  // Champ reset password
  const [resetEmail, setResetEmail] = useState('')

  // ENV injectées au build (client)
  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  // ⚠️ Garde SSR : lors du prerender (server), on retourne un squelette
  if (typeof window === 'undefined') {
    return (
      <main className="page-wrap">
        <h1 className="page-title">CONNEXION / INSCRIPTION</h1>
        <section className="panel">
          <p style={{ color: '#fff', opacity: .8 }}>Chargement…</p>
        </section>
      </main>
    )
  }

  // Affiche "Email confirmé" quand on revient du lien Supabase
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.get('email_confirmed') === '1') {
        setTab('login')
        setMsg({ type: 'ok', text: 'Email confirmé ✅ Vous pouvez maintenant vous connecter.' })
        // Nettoie l'URL (retire ?email_confirmed=1)
        window.history.replaceState(null, '', window.location.pathname)
      }
    } catch {}
  }, [])

  function Notice() {
    if (!msg) return null
    const base = {
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

  // Garde-fou : crée le client ou affiche une erreur claire
  async function getSupabaseOrFail() {
    const { createClient } = await import('@supabase/supabase-js')
    const url = ENV_URL
    const key = ENV_KEY
    if (!url || !key) {
      throw new Error(
        "Configuration Supabase manquante.\n" +
          "Dans Vercel → Project → Settings → Environment Variables, ajoute :\n" +
          "• NEXT_PUBLIC_SUPABASE_URL (Project URL Supabase)\n" +
          "• NEXT_PUBLIC_SUPABASE_ANON_KEY (anon public key)\n" +
          "Puis redeploie."
      )
    }
    return createClient(url, key)
  }

  async function handleLogin(e) {
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
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || "Erreur lors de l'inscription" })
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setMsg(null)

    if (!resetEmail.trim()) {
      setMsg({ type: 'err', text: 'Veuillez saisir votre adresse email' })
      return
    }

    setBusy(true)
    try {
      const supabase = await getSupabaseOrFail()
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error

      setMsg({
        type: 'ok',
        text: 'Email de réinitialisation envoyé ! Vérifiez votre boîte mail (et les spams).'
      })
      setResetEmail('')
      setTimeout(() => setTab('login'), 3000)
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || "Erreur lors de l'envoi" })
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
            
            {/* Lien mot de passe oublié */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setTab('reset')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 14,
                  opacity: 0.8
                }}
              >
                Mot de passe oublié ?
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
              <button type="submit" className="btn-send" disabled={busy || !envOk}>
                {busy ? 'Création…' : 'CRÉER MON COMPTE'}
              </button>
            </div>
            <Notice />
          </form>
        )}

        {/* Réinitialisation mot de passe */}
        {tab === 'reset' && (
          <form className="form" onSubmit={handleResetPassword}>
            <p style={{ color: '#fff', opacity: 0.9, marginBottom: 20, textAlign: 'center' }}>
              Saisissez votre email pour recevoir un lien de réinitialisation.
            </p>
            
            <div className="field">
              <label htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                type="email"
                className="input"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div className="actions">
              <button type="submit" className="btn-send" disabled={busy || !envOk}>
                {busy ? 'Envoi…' : 'ENVOYER LE LIEN'}
              </button>
            </div>
            
            {/* Retour à la connexion */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setTab('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: 14,
                  opacity: 0.8
                }}
              >
                ← Retour à la connexion
              </button>
            </div>
            
            <Notice />
          </form>
        )}
      </section>
    </main>
  )
}
