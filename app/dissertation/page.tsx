"use client"
import { useState } from "react"

export default function DissertationPage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [copie, setCopie] = useState("")
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!matiere.trim() || !sujet.trim() || !copie.trim()) {
    setErreur("⚠️ Merci de remplir les trois champs : matière, sujet et copie complète.")
    setResultat("")
    return
  }
  setErreur("")
  setResultat("⏳ Envoi en cours…")

  const res = await fetch('/api/correct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exercise_kind: 'dissertation',
      matiere, sujet, copie
    })
  })
  const data = await res.json()
  if (!res.ok) { setResultat(""); setErreur(data.error || "Erreur serveur"); return; }

  window.location.href = `/correction/${data.correctionId}`
}

  return (
    <main className="page-wrap">
      {/* Titre sur fond bleu marine (hérite du body) */}
      <h1 className="page-title">DISSERTATION JURIDIQUE 📚</h1>
      <p className="helper">Colle ton sujet et ta copie complète dans les champs ci-dessous</p>

      {/* Carte blanche avec le formulaire */}
      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="matiere">Matière</label>
            <input
              id="matiere"
              className="input"
              type="text"
              placeholder="Ex. droit constitutionnel, droit pénal, droit administratif…"
              value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="sujet">Sujet</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Colle ici l’énoncé exact du sujet (obligatoire)"
              rows={3}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="copie">Ta copie (intégrale)</label>
            <textarea
              id="copie"
              className="textarea"
              placeholder="Colle ici l’intégralité de ta dissertation"
              rows={12}
              value={copie}
              onChange={(e) => setCopie(e.target.value)}
            />
          </div>

          <div className="actions">
            <button type="submit" className="btn-send" aria-label="Envoyer pour correction">
              {/* Icône d’envoi en SVG, pas un emoji */}
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
    </main>
  )
}
