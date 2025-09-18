// app/correction/[id]/page.tsx
import AnnotatedTeaser from "../AnnotatedTeaser"

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionPage({ params }: Props) {
  const correctionId = params.id
  
  // URL de base pour l'appel serveur
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
    "http://localhost:3000"

  let correction: {
    status: string
    result?: any
    isUnlocked?: boolean
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
        result: data.result || {},
        isUnlocked: data.isUnlocked || false
      }
    }
  } catch (err) {
    console.error('Error fetching correction:', err)
  }

  // Si pas de correction ou pas encore ready
  if (!correction || correction.status !== "ready") {
    return (
      <main className="page-wrap correction">
        <h1 className="page-title">CORRECTION</h1>
        <AnnotatedTeaser submissionId={correctionId} />
      </main>
    )
  }

  // Si pas débloqué, afficher la version teaser
  if (!correction.isUnlocked) {
    return (
      <main className="page-wrap correction">
        <h1 className="page-title">CORRECTION</h1>
        <AnnotatedTeaser submissionId={correctionId} />
      </main>
    )
  }

  // Version complète débloquée
  const result = correction.result || {}
  const body = result.normalizedBody ?? result.body ?? ""
  const globalComment = result.globalComment ?? result.global_comment ?? ""
  const inline = Array.isArray(result.inline) ? result.inline : []

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
          ✅ Correction débloquée
        </span>
      </div>

      <section className="panel" style={{ position: "relative" }}>
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
        </div>
      </section>
    </main>
  )
}
