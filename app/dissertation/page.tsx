"use client"
import { useState } from "react"

export default function DissertationPage() {
  const [matiere, setMatiere] = useState("")
  const [sujet, setSujet] = useState("")
  const [fichier, setFichier] = useState<File | null>(null)
  const [erreur, setErreur] = useState("")
  const [resultat, setResultat] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [debug, setDebug] = useState("") // s'affiche seulement si ça coince

  // 1) Upload .docx → texte
  async function uploadDocx(file: File): Promise<string> {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Upload .docx échoué")
    return data.text as string
  }

  // 2) Extraction ultra-robuste de l'ID
  function pickIdLoose(data: any): string | undefined {
    // chemins connus
    const direct =
      data?.correctionId ??
      data?.correction_id ??
      data?.id ??
      data?.result?.id ??
      data?.correction?.id ??
      data?.data?.id
    if (isValidId(direct)) return String(direct)

    // recherche récursive d'une valeur ressemblant à un ID (UUID/slug) dans l'objet
    const seen = new Set<any>()
    function scan(obj: any): string | undefined {
      if (!obj || typeof obj !== "object" || seen.has(obj)) return
      seen.add(obj)
      for (const k of Object.keys(obj)) {
        const v = (obj as any)[k]
        if (typeof v === "string" && isValidId(v)) return v
        if (typeof v === "object") {
          const r = scan(v)
          if (r) return r
        }
      }
      return
    }
    return scan(data)
  }

  function isValidId(v: any): boolean {
    if (!v) return false
    const s = String(v).trim()
    // UUID (supabase) ou identifiant alphanumérique assez long
    const uuidRe = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
    const slugRe = /^[A-Za-z0-9_\-]{10,}$/ // fallback (ex: ids non-uuid)
    return uuidRe.test(s) || slugRe.test(s)
  }

  // 3) Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // messages précis et communs
    if (!matiere.trim()) { setErreur("Merci d’indiquer la matière."); setResultat(""); return }
    if (!sujet.trim())   { setErreur("Merci d’indiquer le sujet.");   setResultat(""); return }
    if (!fichier)        { setErreur("Merci de verser le document Word (.docx)."); setResultat(""); return }

    setErreur("")
    setResultat("")
    setDebug("")
    setIsLoading(true)

    try {
      // 1) extraction texte depuis le .docx
      const copieExtraite = await uploadDocx(fichier)

      // 2) appel correction
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
      if (!res.ok) {
        setIsLoading(false)
        setErreur(data?.error || "Erreur serveur")
        return
      }

      // 3) récup ID béton
      const id = pickIdLoose(data)
      if (!id) {
        setIsLoading(false)
        setErreur("Réponse serveur invalide : ID de correction manquant.")
        setDebug(JSON.stringify(data, null, 2)) // on affiche la réponse brute pour voir la vraie clé
        return
      }

      // 4) redirection vers la page DÉJÀ FONCTIONNELLE
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
          {resultat && <p className="msg-ok">{resultat}</p>}

          {/* S'affiche uniquement si l'ID manque : on voit la réponse brute du serveur */}
          {debug && (
            <pre style={{
              marginTop: 14, padding: 12, background: "#0f172a", color: "#e5e7eb",
              borderRadius: 8, overflowX: "auto", fontSize: 12
            }}>
{debug}
            </pre>
          )}
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
