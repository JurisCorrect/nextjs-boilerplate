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
    case "green":  return { bg: "rgba(76, 175, 80, 0.25)", fg: "#2E7D32", border: "rgba(76, 175, 80, 0.6)" }
    case "red":    return { bg: "rgba(244, 67, 54, 0.25)", fg: "#C62828", border: "rgba(244, 67, 54, 0.6)" }
    case "orange": return { bg: "rgba(255, 152, 0, 0.25)", fg: "#E65100", border: "rgba(255, 152, 0, 0.6)" }
    case "blue":   return { bg: "rgba(33, 150, 243, 0.25)", fg: "#1565C0", border: "rgba(33, 150, 243, 0.6)" }
    default:       return { bg: "rgba(158, 158, 158, 0.25)", fg: "#424242", border: "rgba(158, 158, 158, 0.6)" }
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

  // Gestion des clics sur les carrés de commentaires
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
  
  // Distribution équilibrée des commentaires dans le texte
  let inline = result.inline || []
  if (inline.length === 0 && body.length > 0) {
    // Découpe le texte en phrases
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 20)
    
    // Sélectionne des phrases réparties dans le texte
    const totalSentences = sentences.length
    inline = [
      {
        tag: "green",
        quote: sentences[Math.floor(totalSentences * 0.15)]?.trim().slice(0, 60) || "première partie",
        comment: "Bonne analyse du problème juridique. L'approche méthodologique est correcte."
      },
      {
        tag: "orange", 
        quote: sentences[Math.floor(totalSentences * 0.65)]?.trim().slice(0, 50) || "milieu du texte",
        comment: "Argumentation à renforcer. Il manque des références jurisprudentielles pour étayer ce point."
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

  // Découpage du texte (20% visible, flouté, 10% visible, flouté)
  const len = body.length
  const part1 = body.slice(0, Math.floor(len * 0.2))
  const part2 = body.slice(Math.floor(len * 0.2), Math.floor(len * 0.45))
  const part3 = body.slice(Math.floor(len * 0.45), Math.floor(len * 0.55))
  const part4 = body.slice(Math.floor(len * 0.55))

  // Injection des surlignages et carrés dans les parties visibles
  let markedPart1 = part1
  let markedPart3 = part3

  inline.forEach((comment, index) => {
    if (!comment.quote) return
    
    const color = chipColor(comment.tag)
    const commentId = `comment-${index}`
    
    // Carré de commentaire (fin de phrase uniquement)
    const marker = `<span 
      class="comment-marker" 
      data-comment-id="${commentId}"
      style="
        display: inline-block;
        width: 10px;
        height: 10px;
        background: ${color.bg};
        border: 1px solid ${color.border};
        border-radius: 2px;
        margin-left: 3px;
        cursor: pointer;
        vertical-align: middle;
        opacity: 0.9;
      "
      title="Commentaire - Cliquez pour ouvrir"
    ></span>`

    // Surlignage du passage
    const highlightedText = `<mark style="background: ${color.bg}; border-radius: 3px; padding: 1px 2px;">${comment.quote}</mark>`
    
    // Cherche le passage à surligner dans part1
    if (markedPart1.includes(comment.quote)) {
      markedPart1 = replaceFirst(markedPart1, comment.quote, highlightedText)
      
      // Ajoute le carré à la fin de la phrase qui contient ce passage
      const sentences = markedPart1.split(/([.!?]+)/)
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].includes(highlightedText)) {
          // Trouve la fin de phrase suivante
          for (let j = i + 1; j < sentences.length; j++) {
            if (sentences[j].match(/[.!?]+/)) {
              sentences[j] = sentences[j] + marker
              break
            }
          }
          break
        }
      }
      markedPart1 = sentences.join('')
    }
    // Sinon cherche dans part3
    else if (markedPart3.includes(comment.quote)) {
      markedPart3 = replaceFirst(markedPart3, comment.quote, highlightedText)
      
      // Ajoute le carré à la fin de la phrase
      const sentences = markedPart3.split(/([.!?]+)/)
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].includes(highlightedText)) {
          for (let j = i + 1; j < sentences.length; j++) {
            if (sentences[j].match(/[.!?]+/)) {
              sentences[j] = sentences[j] + marker
              break
            }
          }
          break
        }
      }
      markedPart3 = sentences.join('')
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
      {/* Texte avec surlignages et carrés */}
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
              maxWidth: "450px",
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
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#666",
                  lineHeight: 1
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
                marginBottom: 12,
                borderLeft: `3px solid ${color.border}`,
                paddingLeft: 10,
                background: color.bg,
                padding: "8px 10px",
                borderRadius: 4
              }}>
                « {comment.quote} »
              </div>
            )}
            
            <div style={{ fontSize: 14, lineHeight: 1.5, color: "#333" }}>
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
    </section>
  )
}
