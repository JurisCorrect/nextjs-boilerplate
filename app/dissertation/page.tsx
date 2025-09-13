"use client"
import { useState, useMemo } from "react"

export default function DissertationPage() {
  // === Bloc correction (.docx) — inchangé ===
  const [sujet, setSujet] = useState("")
  const [fichier, setFichier] = useState<File | null>(null)
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (file: File | null) => {
    if (!file) return
    const name = file.name.toLowerCase()
    if (!name.endsWith(".docx")) {
      setErreur("Merci de déposer un fichier .docx.")
      return
    }
    setErreur("")
    setFichier(file)
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files?.[0] ?? null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sujet.trim()) { setErreur("Merci d'indiquer le sujet de la dissertation."); setResultat(""); return }
    if (!fichier)      { setErreur("Merci de verser le document Word (.docx).");   setResultat(""); return }

    setErreur("")
    setResultat("")
    setIsLoading(true)

    try {
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => { const s = String(r.result || ""); resolve(s.split(",")[1] || "") }
        r.onerror = reject
        r.readAsDataURL(file)
      })

      const base64Docx = await toBase64(fichier)

      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_kind: "dissertation",
          matiere: "", // pas de matière
          sujet,
          base64Docx,
          filename: fichier.name,
          copie: `Document Word déposé : ${fichier.name}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setIsLoading(false); setErreur(data.error || "Erreur serveur"); return }

      const id = data?.submissionId || data?.correctionId || data?.id || data?.result?.id
      if (!id) { setIsLoading(false); setErreur("Réponse serveur invalide : ID de correction manquant."); return }

      window.location.href = `/correction/${encodeURIComponent(id)}`
    } catch (err: any) {
      setIsLoading(false)
      setErreur("Erreur détaillée: " + (err?.message || String(err)))
    }
  }

  // === Bloc Paiement & création de compte (nouveau) ===
  const [payEmail, setPayEmail] = useState("")
  const [payPwd, setPayPwd] = useState("")
  const [payPwd2, setPayPwd2] = useState("")
  const [createAccount, setCreateAccount] = useState(true)
  const [payBusy, setPayBusy] = useState(false)
  const [payMsg, setPayMsg] = useState<null | {type:'ok'|'err', text:string}>(null)

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  const getSupabase = useMemo(() => async () => {
    const { createClient } = await import('@supabase/supabase-js')
    if (!envOk) throw new Error('Variables Supabase manquantes')
    return createClient(ENV_URL as string, ENV_KEY as string)
  }, [ENV_URL, ENV_KEY, envOk])

  async function maybeCreateSupabaseAccount() {
    if (!createAccount) return true
    if (!envOk) { setPayMsg({ type:'err', text:'Configuration Supabase manquante' }); return false }
    if (payPwd.length < 8) { setPayMsg({ type:'err', text:'Mot de passe ≥ 8 caractères' }); return false }
    if (payPwd !== payPwd2) { setPayMsg({ type:'err', text:'Mot de passe différent' }); return false }

    try {
      const supabase = await getSupabase()
      const emailRedirectTo = `${window.location.origin}/login?email_confirmed=1`
      const { error } = await supabase.auth.signUp({
        email: payEmail.trim(),
        password: payPwd,
        options: { emailRedirectTo },
      })
      // Si l'email existe déjà, on n'empêche pas le paiement
      if (error && !/registered|exists/i.test(error.message)) {
        setPayMsg({ type:'err', text: error.message })
        return false
      }
      return true
    } catch (e: any) {
      setPayMsg({ type:'err', text: e?.message || 'Erreur création de compte' })
      return false
    }
  }

  async function startCheckout(e: React.FormEvent) {
    e.preventDefault()
    setPayMsg(null)
    setPayBusy(true)

    try {
      const ok = await maybeCreateSupabaseAccount()
      if (!ok) { setPayBusy(false); return }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "dissertation",
          customer_email: payEmail.trim(),
          success_url: "/correction-complete",
          cancel_url: "/dissertation",
        }),
      })
      if (!res.ok) throw new Error("Échec création session de paiement")
      const data = await res.json()
      if (!data?.url) throw new Error("URL de paiement introuvable")
      window.location.href = data.url
    } catch (err: any) {
      setPayMsg({ type:'err', text: err?.message || "Erreur paiement" })
      setPayBusy(false)
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">DISSERTATION 🖋️</h1>
      <p className="helper">Indique le sujet de la dissertation, puis dépose ton document Word (.docx).</p>

      {/* ===== Bloc envoi pour correction (inchangé) ===== */}
      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate aria-busy={isLoading}>
          {/* Sujet (2 cm) */}
          <div className="field">
            <label htmlFor="sujet">Sujet</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Colle ton sujet ici"
              style={{ height: "2cm", minHeight: "2cm" }}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Upload */}
          <div className="field">
            <label>Déposer le document Word (.docx)</label>
            <div className="uploader">
              <input
                id="docx"
                className="uploader-input"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="docx"
                className={`uploader-box ${isDragging ? "is-dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="uploader-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                    <rect x="28" y="20" width="72" height="88" rx="8" ry="8" fill="none" stroke="#94a3b8" strokeWidth="3"/>
                    <path d="M72 20v22a6 6 0 0 0 6 6h22" fill="none" stroke="#94a3b8" strokeWidth="3"/>
                    <rect x="42" y="52" width="44" height="34" rx="4" fill="#0f2a5f"/>
                    <text x="64" y="75" textAnchor="middle" fontFamily="ui-sans-serif, system-ui" fontWeight="800" fontSize="20" fill="#fff">W</text>
                  </svg>
                </div>
                <span className="uploader-btn">Téléchargez votre document ici</span>
                {fichier && <div className="uploader-filename">📄 {fichier.name}</div>}
              </label>
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn-send" disabled={isLoading}>
              ENVOI POUR CORRECTION
            </button>
          </div>

          {erreur && <p className="msg-error">{erreur}</p>}
          {resultat && <p className="msg-ok">{resultat}</p>}
        </form>
      </section>

      {/* ===== Bloc Paiement & création de compte ===== */}
      <section className="panel">
        <form onSubmit={startCheckout} className="form" noValidate>
          <h2 style={{ marginTop:0, marginBottom:12, color:"var(--brand)", fontWeight:900 }}>
            Paiement & création de compte
          </h2>
          <p className="helper" style={{ marginTop:0 }}>
            Utilise ton email pour le paiement. Tu peux créer ton compte maintenant pour retrouver tes corrections.
          </p>

          <div className="field">
            <label htmlFor="pay-email">Email</label>
            <input
              id="pay-email"
              type="email"
              className="input"
              required
              value={payEmail}
              onChange={(e) => setPayEmail(e.target.value)}
              placeholder="vous@email.com"
            />
          </div>

          <label style={{ display:'flex', alignItems:'center', gap:8, color:'#222', margin:'6px 0 8px' }}>
            <input type="checkbox" checked={createAccount} onChange={() => setCreateAccount(!createAccount)} />
            Créer un compte maintenant
          </label>

          {createAccount && (
            <>
              <div className="field">
                <label htmlFor="pay-pwd">Mot de passe</label>
                <input
                  id="pay-pwd"
                  type="password"
                  className="input"
                  required
                  minLength={8}
                  value={payPwd}
                  onChange={(e) => setPayPwd(e.target.value)}
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <div className="field">
                <label htmlFor="pay-pwd2">Confirmer le mot de passe</label>
                <input
                  id="pay-pwd2"
                  type="password"
                  className="input"
                  required
                  value={payPwd2}
                  onChange={(e) => setPayPwd2(e.target.value)}
                  placeholder="Retapez le mot de passe"
                />
              </div>
            </>
          )}

          <div className="actions">
            <button type="submit" className="btn-send" disabled={payBusy}>
              {payBusy ? "Redirection vers le paiement…" : "DÉBLOQUER MA CORRECTION"}
            </button>
          </div>

          {payMsg && (
            <p className={payMsg.type === 'err' ? "msg-error" : "msg-ok"}>{payMsg.text}</p>
          )}

          {!envOk && (
            <p className="msg-error" style={{ marginTop:8 }}>
              Configuration Supabase manquante (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).
            </p>
          )}
        </form>
      </section>

      {isLoading && (
        <div className="loader-overlay" role="status" aria-live="polite" aria-label="Envoi en cours">
          <div className="loader-ring" />
        </div>
      )}
    </main>
  )
}
