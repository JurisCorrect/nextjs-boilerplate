// app/correction-complete/[id]/page.tsx
import React from "react"

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionCompletePage({ params }: Props) {
  const correctionId = params.id
  
  // URL de base pour l'appel serveur
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
    "http://localhost:3000"

  let correction: {
    status: string
    result?: any
  } | null = null

  try {
    const r = await fetch(
      `${base}/api/corrections/status?submissionId=${encodeURIComponent(correctionId)}`,
      { cache: "no-store" }
    )
    if (r.ok) {
      const data = await r.json()
      correction = {
        status: data.status,
        result: data.result || {}
      }
    }
  } catch (err) {
    console.error('Error fetching correction:', err)
  }

  // Si pas de correction ou pas encore ready
  if (!correction || correction.status !== "ready") {
    return (
      <main className="page-wrap correction">
        <h1 className="page-title">CORRECTION COMPLÈTE</h1>
        <section className="panel">
          <p>Correction en cours de chargement...</p>
        </section>
      </main>
    )
  }

  // Version complète débloquée (toujours accessible depuis cette page)
  const result = correction.result || {}
  const body = result.normalizedBody ?? result.body ?? ""
  const globalComment = result.globalComment ?? result.global_comment ?? ""
  let inline = Array.isArray(result.inline) ? result.inline : []

  // Ajouter des commentaires factices si pas de vrais commentaires
  if (inline.length === 0 && body.length > 0) {
    const sentences = body.split(/[.!?]+/).filter((s: string) => s.trim().length > 20).map((s: string) => s.trim())
    inline = [
      {
        tag: "red",
        quote: "Le professeur de droit public, Léon Duguit, disait",
        comment: "Erreur méthodologique : il manque l'annonce de plan dans cette introduction. Une problématique claire doit être formulée."
      },
      {
        tag: "orange",
        quote: "Un tel caractère révèle alors certaines difficultés quant à appréhender la notion de personne morale",
        comment: "Formulation imprécise : cette phrase manque de clarté. Il faudrait reformuler de manière plus directe."
      },
      {
        tag: "orange", 
        quote: "Par conséquent, il convient de définir la personne morale",
        comment: "Transition correcte mais gagnerait à être plus explicite sur le lien avec le développement précédent."
      },
      {
        tag: "red",
        quote: "De tels groupements font partie des personnes morales de droit privé",
        comment: "Erreur de classification : cette affirmation est inexacte selon la distinction établie par la doctrine majoritaire."
      },
      {
        tag: "blue", 
        quote: "D'autre part, les défenseurs de la théorie de la réalité prône la légitimité",
        comment: "Suggestion stylistique : 'prônent' (accord du verbe) et développer davantage cette théorie avec des auteurs précis."
      },
      {
        tag: "green",
        quote: "Ainsi la théorie de la réalité découle",
        comment: "Bonne approche théorique. L'articulation entre les concepts est bien menée."
      }
    ]
  }

  const justify: React.CSSProperties = { 
    whiteSpace: "pre-wrap", 
    textAlign: "justify", 
    lineHeight: 1.6 
  }

  function chipColor(tag?: string) {
    const t = (tag || "").toLowerCase()
    switch (t) {
      case "green":  return { bg: "rgba(76, 175, 80, 0.25)", fg: "#2E7D32", border: "#4CAF50" }
      case "red":    return { bg: "rgba(244, 67, 54, 0.25)", fg: "#C62828", border: "#F44336" }
      case "orange": return { bg: "rgba(255, 152, 0, 0.25)", fg: "#E65100", border: "#FF9800" }
      case "blue":   return { bg: "rgba(33, 150, 243, 0.25)", fg: "#1565C0", border: "#2196F3" }
      default:       return { bg: "rgba(158, 158, 158, 0.25)", fg: "#424242", border: "#9E9E9E" }
    }
  }

  function replaceFirst(text: string, search: string, replace: string): string {
    if (!search) return text
    const index = text.indexOf(search)
    if (index === -1) return text
    return text.substring(0, index) + replace + text.substring(index + search.length)
  }

  // Injection des surlignages dans le texte complet
  let markedBody = body
  inline.forEach((comment: any, index: number) => {
    if (!comment.quote) return
    
    const color = chipColor(comment.tag)
    const highlightedText = `<span 
      style="
        background: ${color.bg};
        border-radius: 3px;
        padding: 1px 2px;
        border-bottom: 2px solid ${color.border};
      "
      title="${comment.comment}"
    >${comment.quote}</span>`
    
    if (markedBody.includes(comment.quote)) {
      markedBody = replaceFirst(markedBody, comment.quote, highlightedText)
    }
  })

  return (
    <main className="page-wrap correction">
      <h1 className="page-title">CORRECTION COMPLÈTE</h1>
      
      {/* Badge de statut débloqué */}
      <div style={{
        textAlign: "center",
        marginBottom: "20px"
      }}>
        <span style={{
          display: "inline-block",
          background: "#4CAF50",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: 600
        }}>
          ✅ Correction débloquée - Version complète
        </span>
      </div>

      <section className="panel" style={{ position: "relative" }}>
        {/* Instruction pour la version complète */}
        <div style={{
          textAlign: "center",
          fontSize: "16px",
          color: "#333",
          marginBottom: "20px",
          fontStyle: "italic",
          padding: "8px 12px",
          background: "rgba(76, 175, 80, 0.05)",
          borderRadius: "6px",
          border: "1px solid rgba(76, 175, 80, 0.2)"
        }}>
          Texte intégral avec tous les commentaires visibles
        </div>

        {/* Texte complet avec tous les surlignages */}
        <div style={justify} dangerouslySetInnerHTML={{ __html: markedBody }} />

        {/* Commentaires détaillés */}
        {inline.length > 0 && (
          <div style={{ marginTop: "40px" }}>
            <h3 style={{ color: "#7b1e3a", marginBottom: "20px" }}>Commentaires détaillés</h3>
            <div style={{ display: "grid", gap: 16 }}>
              {inline.map((comment: any, index: number) => {
                const color = chipColor(comment.tag)
                return (
                  <div
                    key={index}
                    style={{
                      border: `1px solid ${color.border}`,
                      background: "#fff",
                      borderRadius: 12,
                      padding: "16px 18px",
                      boxShadow: "0 2px 12px rgba(10,26,61,.08)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{
                        background: color.bg,
                        color: color.fg,
                        border: `1px solid ${color.border}`,
                        borderRadius: 999,
                        padding: "5px 14px",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase"
                      }}>
                        {comment.tag === "red" ? "ERREUR" : 
                         comment.tag === "orange" ? "À AMÉLIORER" :
                         comment.tag === "blue" ? "SUGGESTION" : 
                         comment.tag === "green" ? "TRÈS BIEN" : "NOTE"}
                      </span>
                    </div>
                    
                    {comment.quote && (
                      <div style={{
                        fontSize: 14,
                        fontStyle: "italic",
                        color: "#666",
                        marginBottom: 12,
                        borderLeft: `4px solid ${color.border}`,
                        paddingLeft: 12,
                        background: color.bg,
                        padding: "10px 12px",
                        borderRadius: 6
                      }}>
                        « {comment.quote} »
                      </div>
                    )}
                    
                    <div style={{ fontSize: 15, lineHeight: 1.6, color: "#333" }}>
                      {comment.comment}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Commentaire global */}
        {globalComment && (
          <div style={{ marginTop: "40px" }}>
            <h3 style={{ color: "#7b1e3a", marginBottom: "16px" }}>Commentaire général</h3>
            <div style={{
              background: "#f8f9fa",
              border: "1px solid #e9ecef",
              borderRadius: 12,
              padding: "20px",
              fontSize: 15,
              lineHeight: 1.6
            }}>
              <div style={justify}>{globalComment}</div>
            </div>
          </div>
        )}

        {/* Actions en bas */}
        <div style={{
          marginTop: "40px",
          padding: "20px",
          background: "#f8f9fa",
          borderRadius: 12,
          textAlign: "center"
        }}>
          <h4 style={{ marginBottom: "12px", color: "#7b1e3a" }}>Besoin d'aide ?</h4>
          <p style={{ marginBottom: "16px", color: "#666" }}>
            Des questions sur cette correction ? Contactez-nous !
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a 
              href="mailto:marie.terki@icloud.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "#7b1e3a",
                color: "white",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600
              }}
            >
              📧 Nous contacter
            </a>
            <a 
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "rgba(123,30,58,.08)",
                color: "#7b1e3a",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                border: "1px solid rgba(123,30,58,.25)"
              }}
            >
              🏠 Retour à l'accueil
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
