"use client"
import { useState } from "react"

export default function DissertationPage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [fichier, setFichier] = useState<File | null>(null)
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Envoie le .docx à /api/upload et récupère le texte extrait
  async function uploadDocx(file: File): Promise<string> {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Upload .docx échoué")
    return data.text as string
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifs simples
    if (!matiere.trim() || !sujet.trim()) {
      setErreur("⚠️ Merci de renseigner la matière et le sujet.")
      setResultat("")
      return
    }
    if (!fichier) {
      setErreur("⚠️ Merci de déposer votre document Word (.docx).")
      setResultat("")
      return
    }

    setErreur("")
    setResultat("")
    setIsLoading(true)

    try {
      // 1) Upload + extraction du texte de votre document
      const copieExtraite = await uploadDocx(fichier)

      // 2) Appel de l’API de correction
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_kind: "dissertation",
          matiere,
          sujet,
          copie: copieExtraite,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setIsLoading(false)
        setErreur(data.error || "Erreur serveur")
        return
      }

      // 3) Redirection vers la page d’AFFICHAGE de dissertation : /dissertation/[id]
      if (!data?.correctionId) {
        setIsLoading(false)
        setErreur("Réponse serveur invalide : ID de correction manquant.")
        return
      }
      window.location.href = `/dissertation/${encodeURIComponent(data.correctionId)}`
    } catch (err: any) {
      setIsLoading(false)
      setErreur(err.message || "Impossible de traiter le fichier.")
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">DISSERTATION 🖋️</h1>
      <p className="helper">Indique la matière et le sujet, puis dépose ton document Word (.docx)</p>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="matiere">Matière</label>
            <input
              id="matiere"
              className="input"
              type="text"
              placeholder="Ex : Droit constitutionnel"
              value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="sujet">Sujet</label>
            <input
              id="sujet"
              className="input"
              type="text"
              placeholder="Ex : La séparation des pouvoirs"
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="docx">Déposer le document Word (.docx)</label>
            <input
              id="docx"
              className="input"
              type="file"
              accept=".docx"
              onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            />
            <p className="intro" style={{ marginTop: 6 }}>
              Formats acceptés : .docx (Word récent). Le contenu sera extrait automatiquement.
            </p>
          </div>

          <div className="actions">
            <button type="submit" className="btn-send" aria-label="Envoyer pour correction">
              ENVOI POUR CORRECTION
            </button>
          </div>

          {erreur && <p className="msg-error">{erreur}</p>}
          {resultat && <p className="msg-ok">{resultat}</p>}
        </form>
      </section>

      {/* Loader plein écran pendant l’envoi */}
      {isLoading && (
        <div className="loader-overlay" role="status" aria-live="polite" aria-label="Envoi en cours">
          <div className="loader-ring" />
        </div>
      )}
    </main>
  )
}
