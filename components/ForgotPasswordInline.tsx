'use client'
import { useMemo, useState } from 'react'

type Props = { emailFromLogin?: string }

export function ForgotPasswordInline({ emailFromLogin }: Props) {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<{type:'ok'|'err', text:string}|null>(null)
  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const effectiveEmail = useMemo(() => (emailFromLogin || email || '').trim(), [emailFromLogin, email])
  const hasExternalEmail = Boolean(emailFromLogin && emailFromLogin.includes('@'))

  async function sendReset() {
    setMsg(null)
    if (!effectiveEmail) {
      setMsg({ type:'err', text:'Renseigne ton email.' })
      return
    }
    try {
      const { createClient } = await import('@supabase/supabase-js')
      if (!ENV_URL || !ENV_KEY) throw new Error('Configuration Supabase manquante')
      const supabase = createClient(ENV_URL, ENV_KEY)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(effectiveEmail, {
        redirectTo: `${origin}/reset-password`,
      })
      if (error) throw error
      setMsg({ type:'ok', text:'Email envoyé ! Vérifie ta boîte mail.' })
    } catch (e:any) {
      setMsg({ type:'err', text: e?.message || 'Erreur lors de l’envoi' })
    }
  }

  return (
    <div className="fp-wrap">
      {!hasExternalEmail && (
        <input
          type="email"
          placeholder="Votre email"
          className="fp-input"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
      )}

      <button
        type="button"
        className="fp-btn"
        onClick={sendReset}
        disabled={!effectiveEmail}
        aria-disabled={!effectiveEmail}
        title={effectiveEmail ? 'Envoyer le lien de réinitialisation' : 'Saisis ton email'}
      >
        <span>Mot de passe oublié ?</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {msg && (
        <div className={`fp-note ${msg.type === 'ok' ? 'ok' : 'err'}`}>
          {msg.text}
        </div>
      )}

      {/* DESIGN SEULEMENT */}
      <style jsx>{`
        /* Tu peux surcharger la couleur d'accent ici si tu veux */
        .fp-wrap { --accent:#7b1e3a; --accent-600:#691a33; --accent-ring:rgba(123,30,58,.35); }

        .fp-wrap{
          display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:center;
        }

        .fp-input{
          width:min(320px, 100%); padding:12px 14px; border-radius:12px;
          background:rgba(0,0,0,0.04);
          border:1px solid rgba(0,0,0,0.12);
          color:inherit;
          outline:none;
          transition:box-shadow .2s, border-color .2s, background .2s;
        }
        /* meilleure lisibilité si fond clair */
        :global(.panel) & .fp-input { background: rgba(0,0,0,0.04); }
        .fp-input::placeholder{ opacity:.6; }
        .fp-input:focus{
          border-color:var(--accent);
          box-shadow:0 0 0 6px var(--accent-ring);
          background:rgba(0,0,0,0.02);
        }

        .fp-btn{
          display:inline-flex; align-items:center; gap:10px; padding:12px 18px; border-radius:999px;
          border:1px solid transparent;
          background:var(--accent);
          color:#fff; font-weight:700; letter-spacing:.2px; cursor:pointer;
          transition:transform .15s, box-shadow .2s, filter .2s, background .2s;
          box-shadow:0 6px 18px rgba(0,0,0,.18);
        }
        .fp-btn:hover{ transform:translateY(-1px); background:var(--accent-600); }
        .fp-btn:focus-visible{ outline:none; box-shadow:0 0 0 4px var(--accent-ring), 0 6px 18px rgba(0,0,0,.2); }
        .fp-btn[disabled]{ opacity:.6; cursor:not-allowed; transform:none; }

        .fp-note{
          width:100%; margin-top:10px; padding:10px 12px; border-radius:10px; font-weight:600; text-align:center;
        }
        .fp-note.ok{ color:#1b7f49; background:rgba(27,127,73,0.12); border:1px solid rgba(27,127,73,0.25); }
        .fp-note.err{ color:#a63b3b; background:rgba(166,59,59,0.12); border:1px solid rgba(166,59,59,0.25); }

        @media (max-width: 420px){
          .fp-btn{ width:100%; justify-content:center }
          .fp-input{ width:100% }
        }
      `}</style>
    </div>
  )
}
