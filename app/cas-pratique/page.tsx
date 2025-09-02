"use client"
import { useState } from "react"

export default function CasPratiquePage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")          // ← on garde la valeur
  const [fichier, setFichier] = useState<File | null>(null)
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function uploadDocx(file: File): Promise<string> {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Upload .docx échoué")
    return data.text as string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!matiere.trim() || !sujet.trim()) {
      setErreur("⚠️ Merci de renseigner la matière et l’énoncé du cas pratique.")
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
      const copieExtraite = await uploadDocx(fichier)

      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_kind: "cas-pratique",
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

      window.location.href = `/cas-pratique/${data.correctionId}`
    } catch (err: any) {
      setIsLoading(false)
      setErreur(err.message || "Impossible de traiter le fichier.")
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CAS PRATIQUE 📝</h1>
      <p className="helper">Indique la matière et l’énoncé, puis dépose ton document Word (.docx)</p>

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
            <label htmlFor="sujet">Énoncé du cas pratique</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Énoncé du cas pratique"
              style={{ minHeight: "4cm" }}              // ← hauteur demandée
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
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

      {isLoading && (
        <div className="loader-overlay" role="status" aria-live="polite" aria-label="Envoi en cours">
          <div className="loader-ring" />
        </div>
      )}
    </main>
  )
}
