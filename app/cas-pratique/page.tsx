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
    if (!file.name.toLowerCase().endsWith(".docx")) { setErreur("Merci de déposer un fichier .docx."); return }
    setErreur(""); setFichier(file)
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files?.[0] ?? null) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sujet.trim()) { setErreur("Merci d'indiquer l'énoncé du cas pratique."); setResultat(""); return }
    if (!fichier)      { setErreur("Merci de verser le document Word (.docx)."); setResultat(""); return }

    setErreur(""); setResultat(""); setIsLoading(true)
    try {
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const r = new FileReader(); r.onload = () => { const s = String(r.result || ""); resolve(s.split(",")[1] || "") }; r.onerror = reject; r.readAsDataURL(file)
      })
      const base64Docx = await toBase64(fichier)

      // CHANGEMENT ICI : appel de la bonne route
      const res = await fetch("/api/submissions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Format compatible avec votre route submissions/create
          text: `ÉNONCÉ: ${sujet}\n\nDOCUMENT: ${fichier.name}`,
          payload: {
            text: `ÉNONCÉ: ${sujet}\n\nDOCUMENT: ${fichier.name}`,
            exercise_kind: "cas-pratique",
            sujet,
            base64Docx,
            filename: fichier.name,
          }
        }),
      })
      
      const data = await res.json()
      if (!res.ok) { 
        setIsLoading(false); 
        setErreur(data.error || "Erreur serveur"); 
        return 
      }
      
      // La route submissions/create renvoie { submissionId }
      const submissionId = data?.submissionId
      if (!submissionId) { 
        setIsLoading(false); 
        setErreur("Réponse serveur invalide : ID de soumission manquant."); 
        return 
      }
      
      // Redirection vers la page de correction
      window.location.href = `/correction/${encodeURIComponent(submissionId)}`
      
    } catch (err: any) {
      setIsLoading(false); 
      setErreur("Erreur détaillée: " + (err?.message || String(err)))
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
              <input id="docx-cp" className="uploader-input" type="file" accept=".docx"
                     onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
              <label htmlFor="docx-cp" className={`uploader-box ${isDragging ? "is-dragging" : ""}`}
                     onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <div className="uploader-icon">{/* icône */}</div>
                <span className="uploader-btn">Télécharge ton document ici</span>
                {fichier && <div className="uploader-filename">📄 {fichier.name}</div>}
              </label>
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn-send">ENVOI POUR CORRECTION</button>
          </div>

          {erreur && <p className="msg-error">{erreur}</p>}
          {resultat && <p className="msg-ok">{resultat}</p>}
        </form>
      </section>

      {isLoading && (<div className="loader-overlay" role="status" aria-live="polite"><div className="loader-ring" /></div>)}
    </main>
  )
}
