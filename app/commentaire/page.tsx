"use client"
import { useState } from "react"

export default function CommentairePage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
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

    if (!matiere.trim()) {
      setErreur("Merci d’indiquer la matière.")
      setResultat("")
      return
    }
    if (!sujet.trim()) {
      setErreur("Merci d’indiquer le sujet.")
      setResultat("")
      return
    }
    if (!fichier) {
      setErreur("Merci de verser le document Word (.docx).")
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
          exercise_kind: "commentaire",
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

      const id = data?.correctionId ?? data?.id ?? data?.result?.id
      if (!id) {
        setIsLoading(false)
        setErreur("Réponse serveur invalide : ID de correction manquant.")
        return
      }
      window.location.href = `/correction/${encodeURIComponent(id)}`
    } catch (err: any) {
      setIsLoading(false)
      setErreur(err.message || "Impossible de traiter le fichier.")
    }
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">COMMENTAIRE D'ARRÊT / FICHE D'ARRÊT ⚖️</h1>
      <p className="helper">Indique la matière et le sujet, puis dépose ton document Word (.docx)</p>

      <section className="panel">
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="matiere">Matière</label>
            <input
              id="matiere"
              className="input"
              type="text"
              placeholder="Ex : Droit administratif"
              value={matiere}
              onChange={(e) => setMatiere(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label htmlFor="sujet">Sujet (arrêt / extrait à commenter)</label>
            <textarea
              id="sujet"
              className="textarea"
              placeholder="Mettre l'arrêt ou l'extrait de l'arrêt à commenter"
              style={{ minHeight: "4cm" }}
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
            />
          </div>

          {/* ===== Uploader moderne (.docx) ===== */}
          <div className="field">
            <label>Déposer le document Word (.docx)</label>

            <div className="uploader">
              <input
                id="docx-commentaire"
                className="uploader-input"
                type="file"
                accept=".docx"
                onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
              />

              <label htmlFor="docx-commentaire" className="uploader-box">
                {/* Icône Word minimaliste */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" aria-hidden="true">
                  <rect x="28" y="20" width="72" height="88" rx="8" ry="8" fill="none" stroke="#bfc7e6" strokeWidth="6"/>
                  <path d="M72 20v22a6 6 0 0 0 6 6h22" fill="none" stroke="#bfc7e6" strokeWidth="6"/>
                  <rect x="42" y="52" width="44" height="34" rx="4" fill="#2b5bd7"/>
                  <text x="64" y="75" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, -apple-system" fontWeight="800" fontSize="20" fill="#fff">W</text>
                </svg>

                <span className="uploader-btn">Téléchargez votre document ici</span>
              </label>

              {fichier && <p className="uploader-filename">{fichier.name}</p>}

              <p className="uploader-note">Vos écrits restent confidentiels</p>
            </div>
          </div>
          {/* ===== fin uploader ===== */}

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
