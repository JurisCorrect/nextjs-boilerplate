'use client'
import { useState } from 'react'

export function ForgotPasswordInline() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<{type:'ok'|'err', text:string}|null>(null)
  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  async function sendReset() {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      if (!ENV_URL || !ENV_KEY) throw new Error('Configuration Supabase manquante')
      const supabase = createClient(ENV_URL, ENV_KEY)

      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      })
      if (error) throw error
      setMsg({ type:'ok', text:'Email envoyé ! Vérifie ta boîte mail.' })
    } catch (e:any) {
      setMsg({ type:'err', text: e?.message || 'Erreur lors de l’envoi' })
    }
  }

  return (
    <div style={{marginTop:12}}>
      <input
        type="email"
        placeholder="Votre email"
        className="input"
        value={email}
        onChange={e=>setEmail(e.target.value)}
      />
      <button type="button" className="btn-ghost" onClick={sendReset} style={{marginLeft:8}}>
        Mot de passe oublié ?
      </button>
      {msg && (
        <div style={{
          marginTop:10, padding:10, borderRadius:8,
          color: msg.type==='ok' ? '#2ed573' : '#ff6b6b',
          background: msg.type==='ok' ? 'rgba(46,213,115,.12)' : 'rgba(255,107,107,.12)'
        }}>
          {msg.text}
        </div>
      )}
    </div>
  )
}
