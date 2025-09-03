"use client"
import { useState } from "react"

export default function DissertationPage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [fichier, setFichier] = useState<File | null>(null)
  const [erreur, setErreur] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur("")
    if (!matiere.trim()) return setErreur("Merci d'indiquer la matière.")
    if (!sujet.trim()) return setErreur("Merci d'indiquer le sujet.")
    if (!fichier) return setErreur("Merci de déposer un fichier .docx.")

    setIsLoading(true)
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_kind: "dissertation",
          matiere,
          sujet,
          // on n’extrait rien : juste un marqueur
          copie: `Document Word déposé : ${fichier.name}`
        })
      })

      const data = await res.json()
      if (!res.ok) {
        // on montre l’erreur détaillée renvoyée par l’API
        throw new Error(data?.detail || data?.error || "Erreur inconnue API")
      }

      const id = data?.correctionId
      if (!id) throw new Error("ID de correction manquant")

      window.location.href = `/correction/${encodeURIComponent(id)}`
    } catch (err: any) {
      console.log("Erreur complète:", err)
      setErreur(err?.message || String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <h1>Dissertation</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Matière"
          value={matiere}
          onChange={(e) => setMatiere(e.target.value)}
        />
        <input
          placeholder="Sujet"
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
        />
        <input
          type="file"
          accept=".doc,.docx"
          onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Envoi..." : "ENVOI POUR CORRECTION"}
        </button>
        {erreur && <div style={{ color: "crimson" }}>{erreur}</div>}
      </form>
    </div>
  )
}
