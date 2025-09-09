"use client"
import { useState } from "react"

export default function DissertationPage() {
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

  return (
    <main className="page-wrap">
      <h1 className="page-title">DISSERTATION 🖋️</h1>
      <p className="helper">Indique le sujet de la dissertation, puis dépose ton document Word (.docx).</p>

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

      {isLoading && (
        <div className="loader-overlay" role="status" aria-live="polite" aria-label="Envoi en cours">
          <div className="loader-ring" />
        </div>
      )}
    </main>
  )
}
