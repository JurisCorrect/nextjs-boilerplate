"use client"
import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState("")

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr("")
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: `${window.location.origin}` } })
    if (error) setErr(error.message); else setSent(true)
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CONNEXION</h1>
      <section className="panel">
        {sent ? <p>📧 Lien envoyé ! Vérifie ta boîte mail.</p> : (
          <form onSubmit={handle} className="form">
            <label htmlFor="email">E-mail</label>
            <input id="email" className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.fr" />
            <button className="btn-send" type="submit">Recevoir le lien</button>
            {err && <p className="msg-error">{err}</p>}
          </form>
        )}
      </section>
    </main>
  )
}
