"use client"
import { useState } from "react"

export default function CasPratiquePage() {
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

    if (!sujet.trim()) { setErreur("Merci d'indiquer l'énoncé du cas pratique."); setResultat(""); return }
    if (!fichier)      { setErreur("Merci de verser le document Word (.docx).");   setResultat(""); return }

    setErreur("")
    setResultat("")
    setIsLoading(true)

    try {
      // ⬇️ Envoi en multipart/form-data (comme ta page Dissertation)
      const form = new FormData()
      form.append("mode", "cas-pratique")  // le backend mettra exercise_kind="cas-pratique"
      form.append("sujet", sujet)
      form.append("file", fichier)

      const res = await fetch("/api/submissions/create", {
        method: "POST",
        body: form, // ne PAS définir Content-Type : le navigateur s'en charge
      })

      const data = await res.json()
      if (!res.ok || !data?.submissionId) {
        setIsLoading(false)
        setErreur(data?.error || "Erreur serveur")
        return
      }

      // ➜ redirection directe vers la page correction (spinner puis aperçu)
      window.location.href = `/correction/${encodeURIComponent(data.submissionId)}`
    } catch (err: any) {
      setIsLoading(false)
      setErreur(err?.message || "Erreur")
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CAS PRATIQUE 📝</h1>
      <p className="helper">Colle ton énoncé de cas pratique, puis dépose ton document Word (.docx).</p>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate aria-busy={isLoading}>
          <div className="field">
            <label htmlFor="sujet">Énoncé de cas pratique</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Colle ton énoncé de cas pratique"
              style={{ height: "3cm", minHeight: "3cm" }}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label>Déposer le document Word (.docx)</label>
            <div className="uploader">
              <input
                id="docx-cp"
                className="uploader-input"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="docx-cp"
                className={`uploader-box ${isDragging ? "is-dragging" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="uploader-icon">{/* icône */}</div>
                <span className="uploader-btn">Télécharge ton document ici</span>
                {fichier && <div className="uploader-filename">📄 {fichier.name}</div>}
              </label>
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn-send" disabled={isLoading}>
              {isLoading ? "Envoi…" : "ENVOI POUR CORRECTION"}
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
