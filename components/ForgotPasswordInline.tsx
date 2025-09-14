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
    <div className="fp-wrap">
      <input
        type="email"
        placeholder="Votre email"
        className="fp-input"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />
      <button type="button" className="fp-btn" onClick={sendReset}>
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

      {/* --- styles uniquement design --- */}
      <style jsx>{`
        .fp-wrap{
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
          justify-content:center;
        }
        .fp-input{
          width:min(320px, 100%);
          padding:12px 14px;
          border-radius:12px;
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.16);
          color:#fff;
          outline:none;
          transition:box-shadow .2s ease, border-color .2s ease, background .2s ease;
        }
        .fp-input::placeholder{ color:rgba(255,255,255,0.55); }
        .fp-input:focus{
          border-color:rgba(123,30,58,.45); /* ta couleur d’accent (#7b1e3a) */
          box-shadow:0 0 0 6px rgba(123,30,58,.18);
          background:rgba(255,255,255,0.08);
        }

        .fp-btn{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:12px 16px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,0.18);
          background:linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06));
          color:#fff;
          font-weight:700;
          letter-spacing:.2px;
          cursor:pointer;
          transition:transform .15s ease, box-shadow .2s ease, border-color .2s ease, background .2s ease;
          backdrop-filter:saturate(1.1) blur(6px);
        }
        .fp-btn:hover{
          transform:translateY(-1px);
          border-color:rgba(123,30,58,.5);
          box-shadow:0 4px 18px rgba(0,0,0,.25), inset 0 0 0 1px rgba(123,30,58,.25);
          background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));
        }
        .fp-btn:active{ transform:translateY(0); }

        .fp-note{
          width:100%;
          margin-top:10px;
          padding:10px 12px;
          border-radius:10px;
          font-weight:600;
          text-align:center;
        }
        .fp-note.ok{
          color:#2ed573;
          background:rgba(46,213,115,0.12);
          border:1px solid rgba(46,213,115,0.25);
        }
        .fp-note.err{
          color:#ff6b6b;
          background:rgba(255,107,107,0.12);
          border:1px solid rgba(255,107,107,0.25);
        }

        @media (max-width: 420px){
          .fp-wrap{ gap:10px }
          .fp-btn{ width:100%; justify-content:center }
          .fp-input{ width:100% }
        }
      `}</style>
    </div>
  )
}
