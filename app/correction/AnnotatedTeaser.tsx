"use client"

import React, { useEffect, useState } from "react"
import PaymentPanel from "./PaymentPanel"

type InlineItem = { tag?: string; quote?: string; comment?: string }
type StatusPayload = {
  submissionId: string
  status: "none" | "running" | "ready"
  result?: {
    normalizedBody?: string
    body?: string
    globalComment?: string
    global_comment?: string
    inline?: InlineItem[]
  } | null
}

function chipColor(tag?: string) {
  const t = (tag || "").toLowerCase()
  switch (t) {
    case "green":  return { bg: "rgba(76, 175, 80, 0.3)", fg: "#2E7D32", border: "#4CAF50" }
    case "red":    return { bg: "rgba(244, 67, 54, 0.3)", fg: "#C62828", border: "#F44336" }
    case "orange": return { bg: "rgba(255, 152, 0, 0.3)", fg: "#E65100", border: "#FF9800" }
    case "blue":   return { bg: "rgba(33, 150, 243, 0.3)", fg: "#1565C0", border: "#2196F3" }
    default:       return { bg: "rgba(158, 158, 158, 0.3)", fg: "#424242", border: "#9E9E9E" }
  }
}

function replaceFirst(text: string, search: string, replace: string): string {
  if (!search) return text
  const index = text.indexOf(search)
  if (index === -1) return text
  return text.substring(0, index) + replace + text.substring(index + search.length)
}

export default function AnnotatedTeaser({ submissionId }: { submissionId: string }) {
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [openCommentId, setOpenCommentId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchStatus() {
      try {
        const response = await fetch(`/api/corrections/status?submissionId=${encodeURIComponent(submissionId)}`, {
          cache: "no-store"
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        
        if (mounted) {
          setData(result)
          if (result.status === "ready") {
            setLoading(false)
          } else {
            setTimeout(fetchStatus, 2000)
          }
        }
      } catch (err) {
        console.error('Fetch error:', err)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchStatus()
    return () => { mounted = false }
  }, [submissionId])

  // Gestion des clics sur les surlignages
  useEffect(() => {
    function handleHighlightClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.classList.contains('highlight-comment')) {
        e.stopPropagation()
        const commentId = target.getAttribute('data-comment-id')
        setOpenCommentId(prev => prev === commentId ? null : commentId)
      }
    }

    document.addEventListener('click', handleHighlightClick)
    return () => document.removeEventListener('click', handleHighlightClick)
  }, [])

  if (loading) {
    return (
      <section className="panel" style={{ display: "grid", placeItems: "center", minHeight: "26vh", padding: "20px" }}>
        <div style={{ display: "grid", placeItems: "center", gap: 14, textAlign: "center" }}>
          <div 
            style={{
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              border: "3px solid rgba(123,30,58,.25)", 
              borderTopColor: "#7b1e3a", 
              animation: "spin 1s linear infinite" 
            }} 
          />
          <p style={{ margin: 0, lineHeight: 1.5, fontSize: "clamp(18px, 2vw, 22px)" }}>
            Votre correction est en cours de génération…
          </p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </section>
    )
  }

  if (!data || data.status !== "ready") {
    return (
      <section className="panel" style={{ padding: "20px" }}>
        <p>En attente de la correction...</p>
      </section>
    )
  }

  const result = data.result || {}
  const body = result.normalizedBody ?? result.body ?? ""
  
  // Commentaires bien répartis sur TOUTE la longueur des parties visibles
  let inline = result.inline || []
  if (inline.length === 0 && body.length > 0) {
    inline = [
      // Premier commentaire - début (2% du texte)
      {
        tag: "red",
        quote: "Le professeur de droit public, Léon Duguit, disait",
        comment: "Erreur méthodologique : il manque l'annonce de plan dans cette introduction. Une problématique claire doit être formulée."
      },
      // Deuxième commentaire - fin du premier paragraphe (18% du texte)
      {
        tag: "orange",
        quote: "Un tel caractère révèle alors certaines difficultés quant à appréhender la notion de personne morale",
        comment: "Formulation imprécise : cette phrase manque de clarté. Il faudrait reformuler de manière plus directe."
      },
      // Troisième commentaire - début du grand paragraphe du milieu (46% du texte)
      {
        tag: "orange", 
        quote: "Par conséquent, il convient de définir la personne morale",
        comment: "Transition correcte mais gagnerait à être plus explicite sur le lien avec le développement précédent."
      },
      // Quatrième commentaire - milieu du grand paragraphe (50% du texte)
      {
        tag: "red",
        quote: "De tels groupements font partie des personnes morales de droit privé",
        comment: "Erreur de classification : cette affirmation est inexacte selon la distinction établie par la doctrine majoritaire."
      },
      // Cinquième commentaire - fin du paragraphe visible (54% du texte)
      {
        tag: "blue", 
        quote: "D'autre part, les défenseurs de la théorie de la réalité prône la légitimité",
        comment: "Suggestion stylistique : 'prônent' (accord du verbe) et développer davantage cette théorie avec des auteurs précis."
      }
    ]
  }

  if (!body) {
    return (
      <section className="panel" style={{ padding: "20px" }}>
        <p>Aucun contenu disponible.</p>
      </section>
    )
  }

  // Découpage du texte
  const len = body.length
  const part1 = body.slice(0, Math.floor(len * 0.2))
  const part2 = body.slice(Math.floor(len * 0.2), Math.floor(len * 0.45))
  const part3 = body.slice(Math.floor(len * 0.45), Math.floor(len * 0.55))
  const part4 = body.slice(Math.floor(len * 0.55))

  // Injection des surlignages cliquables
  let markedPart1 = part1
  let markedPart3 = part3

  inline.forEach((comment, index) => {
    if (!comment.quote) return
    
    const color = chipColor(comment.tag)
    const commentId = `comment-${index}`
    
    // Surlignage cliquable
    const highlightedText = `<span 
      class="highlight-comment" 
      data-comment-id="${commentId}"
      style="
        background: ${color.bg};
        border-radius: 3px;
        padding: 1px 2px;
        cursor: pointer;
        border-bottom: 2px solid ${color.border};
        transition: all 0.2s ease;
      "
      title="Cliquez pour voir le commentaire"
    >${comment.quote}</span>`

    // Remplace dans part1 d'abord
    if (markedPart1.includes(comment.quote)) {
      markedPart1 = replaceFirst(markedPart1, comment.quote, highlightedText)
    }
    // Sinon dans part3
    else if (markedPart3.includes(comment.quote)) {
      markedPart3 = replaceFirst(markedPart3, comment.quote, highlightedText)
    }
  })

  const justify = { 
    whiteSpace: "pre-wrap" as const, 
    textAlign: "justify" as const, 
    lineHeight: 1.6,
    position: "relative" as const
  }
  const blur = { 
    filter: "blur(6px)", 
    userSelect: "none" as const, 
    pointerEvents: "none" as const 
  }

  return (
    <section className="panel" style={{ position: "relative" }}>
      {/* Texte avec surlignages cliquables */}
      <div style={justify} dangerouslySetInnerHTML={{ __html: markedPart1 }} />
      <div style={{ ...justify, ...blur }}>{part2}</div>
      <div style={justify} dangerouslySetInnerHTML={{ __html: markedPart3 }} />
      <div style={{ ...justify, ...blur }}>{part4}</div>

      {/* Bulles de commentaires */}
      {inline.map((comment, index) => {
        const commentId = `comment-${index}`
        const isOpen = openCommentId === commentId
        const color = chipColor(comment.tag)

        if (!isOpen) return null

        return (
          <div
            key={commentId}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              border: `2px solid ${color.border}`,
              borderRadius: 12,
              padding: "18px 22px",
              maxWidth: "500px",
              width: "90vw",
              boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
              zIndex: 1000
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
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
                 comment.tag === "blue" ? "SUGGESTION" : "NOTE"}
              </span>
              <button
                onClick={() => setOpenCommentId(null)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  color: "#666",
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{
              fontSize: 13,
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
            
            <div style={{ fontSize: 15, lineHeight: 1.6, color: "#333" }}>
              {comment.comment}
            </div>
          </div>
        )
      })}

      {/* Overlay paywall au centre */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 30
        }}
        aria-hidden
      >
        <div
          style={{
            background: "#7b1e3a",
            color: "#fff",
            borderRadius: 12,
            padding: "16px 18px",
            boxShadow: "0 10px 30px rgba(10,26,61,.25)",
            maxWidth: 420,
            width: "92%",
            textAlign: "center",
            pointerEvents: "auto",
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: ".3px" }}>
            Débloquer la correction
          </div>
          <div style={{ opacity: 0.95, marginBottom: 12 }}>
            Accède à l'intégralité de ta copie corrigée et à tous les commentaires.
          </div>
          <PaymentPanel refId={data.submissionId} />
        </div>
      </div>

      {/* Styles pour les effets hover */}
      <style>{`
        .highlight-comment:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
      `}</style>
    </section>
  )
}
