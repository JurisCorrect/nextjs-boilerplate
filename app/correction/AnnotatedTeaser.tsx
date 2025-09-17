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
    case "green":  return { bg: "rgba(200,230,201,.45)", fg: "#1b5e20", br: "rgba(27,94,32,.25)" }
    case "red":    return { bg: "rgba(255,205,210,.45)", fg: "#b71c1c", br: "rgba(183,28,28,.25)" }
    case "orange": return { bg: "rgba(255,224,178,.55)", fg: "#e65100", br: "rgba(230,81,0,.25)" }
    case "blue":   return { bg: "rgba(187,222,251,.55)", fg: "#0d47a1", br: "rgba(13,71,161,.25)" }
    default:       return { bg: "rgba(240,240,240,.9)", fg: "#222", br: "rgba(0,0,0,.12)" }
  }
}

function replaceFirst(hay: string, needle: string, repl: string) {
  if (!needle) return hay
  const i = hay.indexOf(needle)
  if (i < 0) return hay
  return hay.slice(0, i) + repl + hay.slice(i + needle.length)
}

export default function AnnotatedTeaser({ submissionId }: { submissionId: string }) {
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

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
  
  // TEMPORAIRE: Créer des commentaires factices pour tester l'interface
  // En attendant que votre API génère de vrais commentaires inline
  let inline = result.inline || []
  if (inline.length === 0 && body.length > 0) {
    // Trouve quelques phrases dans le texte pour créer des commentaires de démo
    const sentences = body.split('.').filter(s => s.trim().length > 20)
    inline = [
      {
        tag: "green",
        quote: sentences[0]?.slice(0, 50) + "..." || "phrase d'exemple",
        comment: "Bonne analyse juridique. Point bien développé."
      },
      {
        tag: "orange", 
        quote: sentences[1]?.slice(0, 40) + "..." || "autre phrase",
        comment: "À préciser davantage. Manque une référence jurisprudentielle."
      }
    ]
  }
  
  const teaser = inline.slice(0, 2)

  if (!body) {
    return (
      <section className="panel" style={{ padding: "20px" }}>
        <p>Aucun contenu disponible.</p>
      </section>
    )
  }

  // Découpage du texte (20% visible, flouté, 10% visible, flouté)
  const len = body.length
  const idx = (r: number) => Math.floor(len * r)
  const visibleA = body.slice(0, idx(0.2))
  const blurredA = body.slice(idx(0.2), idx(0.45))
  const visibleB = body.slice(idx(0.45), idx(0.55))
  const blurredB = body.slice(idx(0.55))

  // Injection des marqueurs dans les parties visibles
  let markedA = visibleA
  let markedB = visibleB

  teaser.forEach((c, k) => {
    if (!c.quote) return
    const col = chipColor(c.tag)
    const badge = `<sup data-cidx="${k}" class="cm-badge" style="background:${col.bg};color:${col.fg};border:1px solid ${col.br};margin-left:4px;width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font:700 11px/1 sans-serif;cursor:pointer">${k + 1}</sup>`
    
    // Cherche dans la partie A
    if (markedA.includes(c.quote.slice(0, 30))) {
      const shortQuote = c.quote.slice(0, 30)
      markedA = replaceFirst(
        markedA,
        shortQuote,
        `<mark data-cidx="${k}" style="background:${col.bg};border:1px solid ${col.br};border-radius:6px;padding:0 2px;cursor:pointer">${shortQuote}${badge}</mark>`
      )
    }
    // Sinon cherche dans la partie B
    else if (markedB.includes(c.quote.slice(0, 30))) {
      const shortQuote = c.quote.slice(0, 30)
      markedB = replaceFirst(
        markedB,
        shortQuote,
        `<mark data-cidx="${k}" style="background:${col.bg};border:1px solid ${col.br};border-radius:6px;padding:0 2px;cursor:pointer">${shortQuote}${badge}</mark>`
      )
    }
  })

  // Gestion des clics sur les marqueurs
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const mark = target.closest('[data-cidx]') as HTMLElement
      if (!mark) return
      
      const cidx = Number(mark.getAttribute('data-cidx'))
      setOpenIdx(prev => prev === cidx ? null : cidx)
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const justify: React.CSSProperties = { whiteSpace: "pre-wrap", textAlign: "justify", lineHeight: 1.6 }
  const blur: React.CSSProperties = { filter: "blur(6px)", userSelect: "none", pointerEvents: "none" }

  return (
    <section className="panel" style={{ position: "relative" }}>
      {/* Texte avec aperçu partiel */}
      <div style={justify} dangerouslySetInnerHTML={{ __html: markedA }} />
      <div style={{ ...justify, ...blur }}>{blurredA}</div>
      <div style={justify} dangerouslySetInnerHTML={{ __html: markedB }} />
      <div style={{ ...justify, ...blur }}>{blurredB}</div>

      {/* Commentaires en marge */}
      {teaser.length > 0 && (
        <aside style={{
          position: "sticky",
          top: 20,
          float: "right",
          width: "min(300px, 40%)",
          marginTop: "-200px",
          marginLeft: "20px",
          display: "grid",
          gap: 12,
          zIndex: 10
        }}>
          {teaser.map((c, i) => {
            const col = chipColor(c.tag)
            const opened = openIdx === i
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${col.br}`,
                  background: "#fff",
                  borderRadius: 12,
                  padding: "12px 14px",
                  boxShadow: opened ? "0 8px 24px rgba(10,26,61,.18)" : "0 2px 12px rgba(10,26,61,.08)",
                  transition: "all .2s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    background: col.bg,
                    color: col.fg,
                    border: `1px solid ${col.br}`,
                    borderRadius: 999,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 800
                  }}>
                    {(c.tag || "NOTE").toUpperCase()} • {i + 1}
                  </span>
                </div>
                
                {c.quote && (
                  <div style={{ fontSize: 13, fontStyle: "italic", opacity: 0.8, marginBottom: 8 }}>
                    « {c.quote.slice(0, 60)}... »
                  </div>
                )}
                
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: 14,
                  maxHeight: opened ? "none" : "40px",
                  overflow: "hidden",
                  transition: "max-height .2s ease"
                }}>
                  {c.comment}
                </div>
                
                <button
                  onClick={() => setOpenIdx(opened ? null : i)}
                  style={{
                    marginTop: 8,
                    padding: "4px 8px",
                    border: `1px solid ${col.br}`,
                    background: "#fff",
                    color: col.fg,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  {opened ? "Réduire" : "Voir plus"}
                </button>
              </div>
            )
          })}
        </aside>
      )}

      {/* Overlay paywall */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(transparent, rgba(255,255,255,0.95) 50%)",
        padding: "40px 20px 20px",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none"
      }}>
        <div style={{
          background: "rgba(123,30,58,0.95)",
          color: "white",
          borderRadius: 12,
          padding: "16px 20px",
          textAlign: "center",
          maxWidth: 400,
          pointerEvents: "auto",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}>
          <div style={{ fontWeight: 900, marginBottom: 8, fontSize: 16 }}>
            🔓 Débloquer la correction complète
          </div>
          <div style={{ opacity: 0.9, marginBottom: 12, fontSize: 14 }}>
            Accédez à l'intégralité du texte corrigé et à tous les commentaires détaillés.
          </div>
          <PaymentPanel refId={data.submissionId} />
        </div>
      </div>
    </section>
  )
}
