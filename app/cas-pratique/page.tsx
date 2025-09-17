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
    if (!file.name.toLowerCase().endsWith(".docx")) {
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

  async function extractDocxText(file: File): Promise<string> {
    try {
      // @ts-ignore - pas de d.ts pour la build browser de mammoth
      const mammoth = await import("mammoth/mammoth.browser")
      const arrayBuffer = await file.arrayBuffer()
      const { value } = await mammoth.extractRawText({ arrayBuffer })
      return value || ""
    } catch {
      return ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(""); setResultat("")

    if (!sujet.trim()) { setErreur("Merci d'indiquer l'énoncé du cas pratique."); return }
    if (!fichier)      { setErreur("Merci de verser le document Word (.docx)."); return }

    setIsLoading(true)
    try {
      const docText = await extractDocxText(fichier)
      const joinedText =
        `ÉNONCÉ :\n${sujet}\n\n` +
        `COPIE (.docx extrait) :\n${docText || "(extraction indisponible)"}\n`

      const res = await fetch("/api/submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: joinedText,
          payload: {
            text: joinedText,                  // utilisé par /api/corrections/generate
            exercise_kind: "cas-pratique",
            matiere: "",
            sujet,
            filename: fichier.name,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.submissionId) {
        throw new Error(data?.error || "Erreur serveur")
      }

      // ➜ redirection directe vers la page correction (spinner puis aperçu)
      window.location.href = `/correction/${encodeURIComponent(data.submissionId)}`
    } catch (err: any) {
      setErreur(err?.message || "Erreur")
      setIsLoading(false)
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CAS PRATIQUE 📝</h1>
      <p className="helper">Colle ton énoncé de cas pratique, puis dépose ton document Word (.docx).</p>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="sujet">Énoncé de cas pratique</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Colle ton énoncé de cas pratique"
              style={{ height: "3cm", minHeight: "3cm" }}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Déposer le document Word (.docx)</label>
            <div className="uploader">
              <input
                id="docx-cp"
                className="uploader-input"
                type="file"
                accept=".docx"
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
        <div className="loader-overlay" role="status" aria-live="polite">
          <div className="loader-ring" />
        </div>
      )}
    </main>
  )
}
