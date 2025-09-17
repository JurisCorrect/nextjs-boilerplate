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
    case "green":  return { bg: "rgba(76, 175, 80, 0.2)", fg: "#2E7D32", border: "rgba(76, 175, 80, 0.5)" }
    case "red":    return { bg: "rgba(244, 67, 54, 0.2)", fg: "#C62828", border: "rgba(244, 67, 54, 0.5)" }
    case "orange": return { bg: "rgba(255, 152, 0, 0.2)", fg: "#E65100", border: "rgba(255, 152, 0, 0.5)" }
    case "blue":   return { bg: "rgba(33, 150, 243, 0.2)", fg: "#1565C0", border: "rgba(33, 150, 243, 0.5)" }
    default:       return { bg: "rgba(158, 158, 158, 0.2)", fg: "#424242", border: "rgba(158, 158, 158, 0.5)" }
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

  // Gestion des clics sur les petits carrés
  useEffect(() => {
    function handleCommentClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.classList.contains('comment-marker')) {
        e.stopPropagation()
        const commentId = target.getAttribute('data-comment-id')
        setOpenCommentId(prev => prev === commentId ? null : commentId)
      }
    }

    document.addEventListener('click', handleCommentClick)
    return () => document.removeEventListener('click', handleCommentClick)
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
  
  // Commentaires factices intégrés dans le texte
  let inline = result.inline || []
  if (inline.length === 0 && body.length > 0) {
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 30)
    inline = [
      {
        tag: "green",
        quote: sentences[0]?.trim().slice(0, 80) || "première phrase",
        comment: "Excellente introduction. L'accroche est pertinente et permet de capter l'attention du lecteur tout en introduisant le sujet de manière claire."
      },
      {
        tag: "orange", 
        quote: sentences[2]?.trim().slice(0, 60) || "phrase du milieu",
        comment: "Point intéressant mais à développer davantage. Il serait judicieux d'ajouter des références doctrinales ou jurisprudentielles pour étayer cette affirmation."
      },
      {
        tag: "red",
        quote: sentences[4]?.trim().slice(0, 70) || "autre phrase",
        comment: "Attention : erreur juridique ici. Cette interprétation n'est pas conforme à la jurisprudence récente de la Cour de cassation. Voir arrêt du 15 mars 2023."
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

  // Injection des marqueurs dans les parties visibles
  let markedPart1 = part1
  let markedPart3 = part3

  inline.forEach((comment, index) => {
    if (!comment.quote) return
    
    const color = chipColor(comment.tag)
    const commentId = `comment-${index}`
    const marker = `<span 
      class="comment-marker" 
      data-comment-id="${commentId}"
      style="
        display: inline-block;
        width: 12px;
        height: 12px;
        background: ${color.bg};
        border: 1px solid ${color.border};
        border-radius: 2px;
        margin-left: 2px;
        margin-right: 2px;
        cursor: pointer;
        vertical-align: middle;
        position: relative;
        opacity: 0.8;
      "
      title="Cliquez pour voir le commentaire"
    ></span>`

    // Essaye d'abord dans part1
    const searchText = comment.quote.slice(0, 30)
    if (markedPart1.includes(searchText)) {
      markedPart1 = replaceFirst(markedPart1, searchText, searchText + marker)
    }
    // Sinon dans part3
    else if (markedPart3.includes(searchText)) {
      markedPart3 = replaceFirst(markedPart3, searchText, searchText + marker)
    }
    // Sinon à la fin d'une phrase dans part1
    else {
      const sentences1 = markedPart1.split(/[.!?]/)
      if (sentences1.length > index && sentences1[index]) {
        markedPart1 = markedPart1.replace(
          sentences1[index] + '.',
          sentences1[index] + '.' + marker
        )
      }
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
      {/* Texte avec marqueurs intégrés */}
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
              padding: "16px 20px",
              maxWidth: "400px",
              width: "90vw",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              zIndex: 1000
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{
                background: color.bg,
                color: color.fg,
                border: `1px solid ${color.border}`,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 800,
                textTransform: "uppercase"
              }}>
                {comment.tag || "NOTE"}
              </span>
              <button
                onClick={() => setOpenCommentId(null)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                ×
              </button>
            </div>
            
            {comment.quote && (
              <div style={{
                fontSize: 13,
                fontStyle: "italic",
                color: "#666",
                marginBottom: 10,
                borderLeft: `3px solid ${color.border}`,
                paddingLeft: 8
              }}>
                « {comment.quote} »
              </div>
            )}
            
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              {comment.comment}
            </div>
          </div>
        )
      })}

      {/* Overlay paywall au MILIEU comme avant */}
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
    </section>
  )
}
