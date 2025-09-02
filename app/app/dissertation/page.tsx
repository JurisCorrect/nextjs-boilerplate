// app/dissertation/page.tsx
"use client"
import { useState } from "react"

export default function DissertationPage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [copie, setCopie] = useState("")
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!matiere || !sujet || !copie) {
      setErreur("⚠️ Merci de remplir tous les champs (matière, sujet ET copie).")
      return
    }
    setErreur("")
    // Pour l'instant, on renvoie une correction factice
    setResultat("✅ Merci ! Ta copie a bien été envoyée. La correction s’affichera ici.")
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1 style={{ textAlign: "center", fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        📚 DISSERTATION JURIDIQUE
      </h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <label>
          Matière :
          <select value={matiere} onChange={(e) => setMatiere(e.target.value)} style={{ width: "100%", padding: "8px" }}>
            <option value="">-- Choisis une matière --</option>
            <option value="droit-constitutionnel">Droit constitutionnel</option>
            <option value="droit-civil">Droit civil</option>
            <option value="droit-penal">Droit pénal</option>
            <option value="droit-administratif">Droit administratif</option>
          </select>
        </label>

        <label>
          Sujet :
          <textarea value={sujet} onChange={(e) => setSujet(e.target.value)} rows={2} style={{ width: "100%", padding: "8px" }} />
        </label>

        <label>
          Ta copie :
          <textarea value={copie} onChange={(e) => setCopie(e.target.value)} rows={10} style={{ width: "100%", padding: "8px" }} />
        </label>

        <button type="submit" style={{ padding: "12px", background: "#0f2a5f", color: "white", border: "none", borderRadius: "8px" }}>
          Envoyer pour correction
        </button>
      </form>

      {erreur && <p style={{ color: "red", marginTop: "15px" }}>{erreur}</p>}
      {resultat && <p style={{ color: "green", marginTop: "15px" }}>{resultat}</p>}
    </main>
  )
}
