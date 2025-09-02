"use client"
import { useState } from "react"

export default function CommentairePage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [copie, setCopie] = useState("")
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")
  const [isLoading, setIsLoading] = useState(false) // ⬅️ état du loader

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!matiere.trim() || !sujet.trim() || !copie.trim()) {
      setErreur("⚠️ Merci de remplir les trois champs : matière, arrêt (texte) et copie complète.")
      setResultat("")
      return
    }

    setErreur("")
    setResultat("")
    setIsLoading(true) // ⬅️ affiche le loader

    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_kind: "commentaire",
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

      // Redirection vers la page correction
      window.location.href = `/correction/${data.correctionId}`
    } catch (err) {
      setIsLoading(false)
      setErreur("Impossible de contacter le serveur.")
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">COMMENTAIRE D'ARRÊT / FICHE D'ARRÊT ⚖️</h1>
      <p className="helper">Colle l’arrêt (texte intégral) et ta copie complète dans les champs ci-dessous</p>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="matiere">Matière</label>
            <input
              id="matiere"
              className="input"
              type="text"
              placeholder="ex. droit administratif"
              value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="sujet">Arrêt (texte intégral)</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Colle ici le texte intégral de l’arrêt (ou l’extrait fourni par l’enseignant)"
              rows={6}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="copie">Ta copie (commentaire ou fiche)</label>
            <textarea
              id="copie"
              className="textarea"
              placeholder="Colle ici ton commentaire d’arrêt (ou ta fiche d’arrêt) complet(e)"
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

      {/* Loader plein écran */}
      {isLoading && (
        <div className="loader-overlay" role="status" aria-live="polite" aria-label="Envoi en cours">
          <div className="loader-ring" />
        </div>
      )}
    </main>
  )
}
