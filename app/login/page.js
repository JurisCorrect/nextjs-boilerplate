'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const search = useSearchParams()

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      ),
    []
  )

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Champs login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Champs register
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  // Quand l’email est confirmé par le lien Supabase :
  useEffect(() => {
    if (search?.get('email_confirmed') === '1') {
      setTab('login')
      setMsg({
        type: 'ok',
        text: "Email confirmé ✅ Vous pouvez maintenant vous connecter."
      })
    }
  }, [search])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      })
      if (error) throw error
      // Connexion OK → espace client
      router.push('/correction-complete')
    } catch (err: any) {
      setMsg({ type: 'err', text: err?.message || 'Erreur de connexion' })
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
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
        text:
          "Compte créé 🎉 Vérifiez votre boîte mail et cliquez sur le lien de confirmation. " +
          "Vous serez redirigé(e) vers la page de connexion."
      })
      setRegEmail('')
      setRegPassword('')
      setRegConfirm('')
      setTab('login')
    } catch (err: any) {
      // Exemple : “User already registered”
      setMsg({ type: 'err', text: err?.message || "Erreur lors de l'inscription" })
    } finally {
      setBusy(false)
    }
  }

  // Styles messages (couleurs de ton site)
  function Notice() {
    if (!msg) return null
    const base =
      'margin-top:14px;padding:12px;border-radius:8px;font-weight:600;text-align:center;'
    const style =
      msg.type === 'ok'
        ? base + 'color:#2ed573;background:rgba(46,213,115,0.12);'
        : base + 'color:#ff6b6b;background:rgba(255,107,107,0.12);'
    return <div style={{ cssText: style } as any}>{msg.text}</div>
  }

  // Boutons d’onglet cohérents avec tes couleurs/police
  function Tabs() {
    const active =
      'background:#ffffff;color:#7b1e3a;padding:12px 24px;border:none;border-radius:8px 0 0 8px;cursor:pointer;font-weight:600;font-size:16px;'
    const inactive =
      'background:rgba(255,255,255,0.3);color:#ffffff;padding:12px 24px;border:none;border-radius:0 8px 8px 0;cursor:pointer;font-weight:600;font-size:16px;'
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
        <button
          onClick={() => setTab('login')}
          style={tab === 'login' ? active : inactive.replace('0 8px 8px 0', '8px 0 0 8px')}
        >
          Se connecter
        </button>
        <button
          onClick={() => setTab('register')}
          style={tab === 'register' ? active.replace('8px 0 0 8px', '0 8px 8px 0') : inactive}
        >
          Créer un compte
        </button>
      </div>
    )
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CONNEXION / INSCRIPTION</h1>

      <Tabs />

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
