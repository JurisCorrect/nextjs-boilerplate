"use client"
import { useState } from "react"

export default function CasPratiquePage() {
  const [matiere, setMatiere] = useState("")
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
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!matiere.trim()) { setErreur("Merci d'indiquer la matière."); setResultat(""); return }
    if (!sujet.trim())   { setErreur("Merci d'indiquer l'énoncé du cas pratique.");   setResultat(""); return }
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
          exercise_kind: "cas-pratique",
          matiere,
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
      console.log("Erreur complète:", err)
      setErreur("Erreur détaillée: " + (err?.message || String(err)))
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CAS PRATIQUE 📝</h1>
      <p className="helper">Indique la matière et l'énoncé, puis dépose ton document Word (.docx)</p>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="matiere">Matière</label>
            <input id="matiere" className="input" type="text" placeholder="Ex : Droit pénal"
                   value={matiere} onChange={(e) => setMatiere(e.target.value)} autoComplete="off" />
          </div>

          <div className="field">
            <label htmlFor="sujet">Énoncé du cas pratique</label>
            <textarea id="sujet" className="textarea" placeholder="Colle ici ton cas pratique"
                      style={{ minHeight: "4cm" }} value={sujet} onChange={(e) => setSujet(e.target.value)} />
          </div>

          <div className="field">
            <label>Déposer le document Word (.docx)</label>
            <div className="uploader">
              <input id="docx-cas-pratique" className="uploader-input" type="file" accept=".docx"
                     onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} />
              <label htmlFor="docx-cas-pratique" className={`uploader-box ${isDragging ? "is-dragging" : ""}`}
                     onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <div className="uploader-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                    <rect x="28" y="20" width="72" height="88" rx="8" ry="8" fill="none" stroke="#94a3b8" strokeWidth="3"/>
                    <path d="M72 20v22a6 6 0 0 0 6 6h22" fill="none" stroke="#94a3b8" strokeWidth="3"/>
                    <rect x="42" y="52" width="44" height="34" rx="4" fill="#0f2a5f"/>
                    <text x="64" y="75" textAnchor="middle" fontFamily="ui-sans-serif, system-ui"
                          fontWeight="800" fontSize="20" fill="#fff">W</text>
                  </svg>
                </div>
                <span className="uploader-btn">Téléchargez votre document ici</span>
                {fichier && <div className="uploader-filename">📄 {fichier.name}</div>}
              </label>
            </div>
          </div>

          <div className="actions">
            <button type="submit" className="btn-send" aria-label="Envoyer pour correction">ENVOI POUR CORRECTION</button>
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
/* === CSS CORRECTIF POUR VOS PAGES DE FORMULAIRES === */
/* Ajoutez CECI à la fin de votre globals.css pour corriger les pages dissertation/commentaire/cas-pratique */

/* Page entière */
.page-wrap {
  background: var(--bg) !important;
  min-height: 100vh !important;
  padding: 2rem 0 !important;
}

/* Titre de la page */
.page-title {
  background: var(--brand) !important;
  color: white !important;
  font-size: 2.5rem !important;
  font-weight: 800 !important;
  text-align: center !important;
  margin: 0 0 1rem 0 !important;
  padding: 2rem !important;
  border-radius: 0 !important;
}

/* Description helper */
.helper {
  background: var(--brand) !important;
  color: white !important;
  text-align: center !important;
  padding: 1rem 2rem 2rem !important;
  margin: 0 !important;
  font-size: 1rem !important;
}

/* Panel principal */
.panel {
  max-width: 600px !important;
  margin: 2rem auto !important;
  background: white !important;
  border-radius: 20px !important;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden !important;
  border: 1px solid var(--border) !important;
}

/* Formulaire */
.form {
  padding: 2rem !important;
  background: white !important;
}

/* Chaque field */
.field {
  margin-bottom: 1.5rem !important;
}

/* Labels bordeaux avec texte blanc */
.field label {
  display: block !important;
  background: var(--brand) !important;
  color: white !important;
  padding: 0.75rem 1rem !important;
  font-weight: 600 !important;
  border-radius: 8px 8px 0 0 !important;
  margin: 0 0 -2px 0 !important;
  font-size: 1rem !important;
}

/* Inputs et textarea blancs */
.input,
.textarea {
  width: 100% !important;
  padding: 1rem !important;
  border: 2px solid var(--border) !important;
  border-top: none !important;
  border-radius: 0 0 8px 8px !important;
  font-size: 1rem !important;
  background: white !important;
  color: var(--text) !important;
  box-sizing: border-box !important;
  font-family: inherit !important;
  resize: vertical !important;
}

.input:focus,
.textarea:focus {
  outline: none !important;
  border-color: var(--brand) !important;
  box-shadow: 0 0 0 3px rgba(107, 39, 55, 0.1) !important;
}

/* SUPPRESSION du champ sujet pour dissertation */
.field:has(label[for="sujet"]) {
  display: none !important;
}

/* Uploader container */
.uploader {
  margin-top: 1rem !important;
}

/* Input file caché */
.uploader-input {
  display: none !important;
}

/* Zone d'upload PETITE */
.uploader-box {
  display: block !important;
  border: 2px dashed var(--brand) !important;
  border-radius: 12px !important;
  padding: 1.5rem !important;
  text-align: center !important;
  background: #F9FAFB !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  text-decoration: none !important;
}

.uploader-box:hover,
.uploader-box.is-dragging {
  background: rgba(107, 39, 55, 0.05) !important;
  transform: translateY(-2px) !important;
}

/* Icône Word PETITE */
.uploader-icon {
  margin: 0 auto 0.5rem !important;
  width: 48px !important;
  height: 48px !important;
}

.uploader-icon svg {
  width: 48px !important;
  height: 48px !important;
  color: var(--brand) !important;
}

/* Texte upload */
.uploader-btn {
  display: block !important;
  color: var(--brand) !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  margin: 0.5rem 0 !important;
}

/* Nom du fichier */
.uploader-filename {
  color: var(--brand) !important;
  font-size: 0.9rem !important;
  margin-top: 0.5rem !important;
  font-weight: 500 !important;
}

/* Actions container */
.actions {
  margin-top: 2rem !important;
  text-align: center !important;
}

/* Bouton d'envoi */
.btn-send {
  width: 100% !important;
  background: var(--brand) !important;
  color: white !important;
  padding: 1rem 2rem !important;
  border: none !important;
  border-radius: 12px !important;
  font-size: 1.125rem !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  text-transform: uppercase !important;
}

.btn-send:hover {
  background: var(--brand-2) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 20px rgba(107, 39, 55, 0.3) !important;
}

/* Messages d'erreur */
.msg-error {
  background: #FEF2F2 !important;
  color: #DC2626 !important;
  padding: 1rem !important;
  border-radius: 8px !important;
  border-left: 4px solid #DC2626 !important;
  margin: 1rem 0 !important;
  font-size: 0.95rem !important;
}

/* Messages de succès */
.msg-ok {
  background: #F0FDF4 !important;
  color: #16A34A !important;
  padding: 1rem !important;
  border-radius: 8px !important;
  border-left: 4px solid #16A34A !important;
  margin: 1rem 0 !important;
  font-size: 0.95rem !important;
}

/* Loader overlay */
.loader-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.7) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 1000 !important;
}

.loader-ring {
  width: 60px !important;
  height: 60px !important;
  border: 4px solid rgba(255, 255, 255, 0.3) !important;
  border-top: 4px solid white !important;
  border-radius: 50% !important;
  animation: spin 1s linear infinite !important;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Navigation sur pages formulaires */
body:has(.page-wrap) .nav {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px) !important;
}

/* Responsive */
@media (max-width: 768px) {
  .page-wrap {
    padding: 1rem 0 !important;
  }
  
  .panel {
    margin: 1rem !important;
  }
  
  .form {
    padding: 1.5rem !important;
  }
  
  .page-title {
    font-size: 2rem !important;
    padding: 1.5rem !important;
  }
  
  .uploader-box {
    padding: 1rem !important;
  }
}
