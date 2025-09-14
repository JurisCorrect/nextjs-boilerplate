'use client'

import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  if (typeof window === 'undefined') {
    return (
      <main className="page-wrap">
        <h1 className="page-title">NOUVEAU MOT DE PASSE</h1>
        <section className="panel">
          <p style={{ color: '#fff', opacity: .8 }}>Chargement…</p>
        </section>
      </main>
    )
  }

  async function getSupabaseOrFail() {
    const { createClient } = await import('@supabase/supabase-js')
    if (!ENV_URL || !ENV_KEY) {
      throw new Error('Configuration Supabase manquante')
    }
    return createClient(ENV_URL, ENV_KEY)
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setMsg(null)

    if (password.length < 8) {
      setMsg({ type: 'err', text: 'Le mot de passe doit contenir au moins 8 caractères' })
      return
    }
    if (password !== confirmPassword) {
      setMsg({ type: 'err', text: 'Les mots de passe ne correspondent pas' })
      return
    }

    setBusy(true)
    try {
      const supabase = await getSupabaseOrFail()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      setMsg({ type: 'ok', text: 'Mot de passe mis à jour avec succès !' })
      setTimeout(() => {
        window.location.href = '/espace-client'
      }, 2000)
    } catch (err) {
      setMsg({ type: 'err', text: err?.message || 'Erreur lors de la mise à jour' })
    } finally {
      setBusy(false)
    }
  }

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

  return (
    <main className="page-wrap">
      <h1 className="page-title">NOUVEAU MOT DE PASSE</h1>

      <section className="panel">
        <p style={{ color: '#fff', opacity: 0.9, marginBottom: 20, textAlign: 'center' }}>
          Choisissez un nouveau mot de passe sécurisé.
        </p>

        <form className="form" onSubmit={handleResetPassword}>
          <div className="field">
            <label htmlFor="password">Nouveau mot de passe</label>
            <input
              id="password"
              type="password"
              className="input"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez votre mot de passe"
            />
          </div>
          <div className="actions">
            <button type="submit" className="btn-send" disabled={busy || !envOk}>
              {busy ? 'Mise à jour…' : 'METTRE À JOUR'}
            </button>
          </div>
          <Notice />
        </form>
      </section>
    </main>
  )
}
