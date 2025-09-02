"use client"
import { useState } from "react"

export default function CasPratiquePage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [copie, setCopie] = useState("")
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!matiere.trim() || !sujet.trim() || !copie.trim()) {
      setErreur("⚠️ Merci de remplir les trois champs : matière, énoncé et copie complète.")
      setResultat("")
      return
    }

    setErreur("")
    setResultat("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_kind: "cas-pratique",
          matiere,
          sujet,
          copie
        })
      })
      const data = await res.json()

      if (!res.ok) {
        setIsLoading(false)
        setErreur(data.error || "Erreur serveur")
        return
      }

      // ⬇️ Redirection vers la page d'affichage CAS PRATIQUE
      window.location.href = `/cas-pratique/${data.correctionId}`
    } catch (_err) {
      setIsLoading(false)
      setErreur("Impossible de contacter le serveur.")
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CAS PRATIQUE 📝</h1>
      <p className="helper">Colle l’énoncé et ta résolution complète dans les champs ci-dessous</p>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="matiere">Matière</label>
            <input
              id="matiere"
              className="input"
              type="text"
              placeholder="Ex : Droit pénal"
              value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="sujet">Énoncé du cas</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Colle ici l’énoncé exact du cas pratique"
              rows={6}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="copie">Ta copie (résolution complète)</label>
            <textarea
              id="copie"
              className="textarea"
              placeholder="Colle ici ta résolution (qualification, règles applicables, majeure/mineure, conclusion)"
              rows={12}
              value={copie}
              onChange={(e) => setCopie(e.target.value)}
            />
          </div>

          <div className="actions">
            <button type="submit" className="btn-send" aria-label="Envoyer pour correction">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12h13M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              ENVOI POUR CORRECTION
            </button>
          </div>

          {erreur && <p className="msg-error">{erreur}</p>}
          {resultat && <p className="msg-ok">{resultat}</p>}
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
