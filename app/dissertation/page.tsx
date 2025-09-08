"use client"
import { useState } from "react"

export default function DissertationPage() {
  const [matiere, setMatiere] = useState("")
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sujet.trim())   { setErreur("Merci d'indiquer le sujet.");   setResultat(""); return }
    if (!fichier)        { setErreur("Merci de verser le document Word (.docx)."); setResultat(""); return }

    setErreur(""); setResultat(""); setIsLoading(true)

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
          matiere,
          sujet: "", // Supprimé le champ sujet comme demandé
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
      console.log("Erreur complète:", err)
      setErreur("Erreur détaillée: " + (err?.message || String(err)))
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">DISSERTATION 🖋️</h1>
      <p className="helper">Indique la matière, puis dépose ton document Word (.docx)</p>

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
            <label>Déposer le document Word (.docx)</label>
            
            <div className="uploader">
              <input
                id="docx"
                className="uploader-input"
                type="file"
                accept=".docx"
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
                    <rect x="28" y="20" width="72" height="88" rx="8" ry="8" 
                          fill="none" stroke="#94a3b8" strokeWidth="3"/>
                    <path d="M72 20v22a6 6 0 0 0 6 6h22" 
                          fill="none" stroke="#94a3b8" strokeWidth="3"/>
                    <rect x="42" y="52" width="44" height="34" rx="4" fill="#0f2a5f"/>
                    <text x="64" y="75" textAnchor="middle" 
                          fontFamily="ui-sans-serif, system-ui" 
                          fontWeight="800" fontSize="20" fill="#fff">W</text>
                  </svg>
                </div>

                <span className="uploader-btn">
                  Téléchargez votre document ici
                </span>

                {fichier && (
                  <div className="uploader-filename">
                    📄 {fichier.name}
                  </div>
                )}
              </label>
            </div>
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
