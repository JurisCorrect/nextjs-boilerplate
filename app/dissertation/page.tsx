"use client"
import { useState } from "react"

export default function DissertationPage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [fichier, setFichier] = useState<File | null>(null)
  const [erreur, setErreur] = useState("")
  const [debug, setDebug] = useState<string>("") // ← affiche la réponse API si besoin
  const [isLoading, setIsLoading] = useState(false)

  async function uploadDocx(file: File): Promise<string> {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Upload .docx échoué")
    return data.text as string
  }

  function pickId(data: any): string | undefined {
    return (
      data?.correctionId ??
      data?.correction_id ??
      data?.id ??
      data?.result?.id ??
      data?.correction?.id ??
      data?.data?.id
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Messages précis
    if (!matiere.trim()) { setErreur("Merci d’indiquer la matière."); return }
    if (!sujet.trim())   { setErreur("Merci d’indiquer le sujet."); return }
    if (!fichier)        { setErreur("Merci de verser le document Word (.docx)."); return }

    setErreur("")
    setDebug("")
    setIsLoading(true)

    try {
      const copieExtraite = await uploadDocx(fichier)

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
      setDebug(JSON.stringify(data, null, 2)) // ← on affiche ce que renvoie l’API

      if (!res.ok) {
        setIsLoading(false)
        setErreur(data?.error || "Erreur serveur")
        return
      }

      const id = pickId(data)
      if (!id || `${id}`.trim() === "") {
        setIsLoading(false)
        setErreur("Réponse serveur invalide : ID de correction manquant. (voir bloc “Détails techniques” ci-dessous)")
        return
      }

      // ✅ On n’envoie JAMAIS sans ID → plus de 404
      window.location.href = `/correction/${encodeURIComponent(id)}`
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

          {erreur && <p className="msg-error" style={{ whiteSpace: "pre-wrap" }}>{erreur}</p>}
        </form>

        {/* Détails techniques visibles pour diagnostiquer l’ID */}
        {debug && (
          <pre style={{
            marginTop: 14, padding: 12, background: "#0f172a", color: "#e5e7eb",
            borderRadius: 8, overflowX: "auto", fontSize: 12
          }}>
{debug}
          </pre>
        )}
      </section>

      {isLoading && (
        <div className="loader-overlay" role="status" aria-live="polite" aria-label="Envoi en cours">
          <div className="loader-ring" />
        </div>
      )}
    </main>
  )
}
