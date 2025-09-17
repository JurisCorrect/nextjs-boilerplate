"use client"

import React, { useEffect, useMemo, useState } from "react"
import PaymentPanel from "./PaymentPanel"

type InlineItem = { tag?: string; quote?: string; comment?: string }
type StatusPayload = {
  submissionId: string
  status: "none" | "running" | "ready"
  correctionId?: string
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
    case "green":  return { bg:"rgba(200,230,201,.45)", fg:"#1b5e20", br:"rgba(27,94,32,.25)" }
    case "red":    return { bg:"rgba(255,205,210,.45)", fg:"#b71c1c", br:"rgba(183,28,28,.25)" }
    case "orange": return { bg:"rgba(255,224,178,.55)", fg:"#e65100", br:"rgba(230,81,0,.25)" }
    case "blue":   return { bg:"rgba(187,222,251,.55)", fg:"#0d47a1", br:"rgba(13,71,161,.25)" }
    default:       return { bg:"rgba(240,240,240,.9)", fg:"#222",     br:"rgba(0,0,0,.12)" }
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

  // Poll l’état jusqu’à "ready"
  useEffect(() => {
    let stop = false
    async function tick() {
      try {
        const r = await fetch(`/api/corrections/status?submissionId=${encodeURIComponent(submissionId)}`, { cache: "no-store" })
        const j = (await r.json()) as StatusPayload
        if (!stop) setData(j)
        if (!stop && j?.status !== "ready") setTimeout(tick, 1500)
        else setLoading(false)
      } catch {
        if (!stop) setTimeout(tick, 2000)
      }
    }
    tick()
    return () => { stop = true }
  }, [submissionId])

  if (loading || !data || data.status !== "ready") {
    return (
      <section className="panel" style={{ display:"grid", placeItems:"center", minHeight:"26vh", padding:"20px", position:"relative" }}>
        <div style={{ display:"grid", placeItems:"center", gap:14, textAlign:"center" }}>
          <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid rgba(123,30,58,.25)", borderTopColor:"#7b1e3a", animation:"spin 1s linear infinite" }} />
          <p style={{ margin:0, lineHeight:1.5, fontSize:"clamp(18px, 2vw, 22px)" }}>
            Votre correction est en cours de génération… Un aperçu apparaîtra dès qu’il sera prêt.
          </p>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </section>
    )
  }

  const result = data.result || {}
  const body = result.normalizedBody ?? result.body ?? ""
  const inlineAll = Array.isArray(result.inline) ? (result.inline as InlineItem[]) : []
  const teaser = inlineAll.slice(0, 2)

  const len = body.length
  const idx = (r: number) => Math.floor(len * r)
  const visibleA = body.slice(0, idx(0.2))
  const blurredA  = body.slice(idx(0.2), idx(0.45))
  const visibleB = body.slice(idx(0.45), idx(0.55))
  const blurredB  = body.slice(idx(0.55))

  const markedA = useMemo(() => {
    let out = visibleA
    teaser.forEach((c, k) => {
      const n = k + 1
      const col = chipColor(c.tag)
      const badge = `<sup data-cidx="${k}" class="cm-badge" style="background:${col.bg};color:${col.fg};border:1px solid ${col.br}">${n}</sup>`
      if (c.quote) {
        out = replaceFirst(
          out,
          c.quote,
          `<mark class="cm-hl" data-cidx="${k}" style="background:${col.bg};border:1px solid ${col.br}">${c.quote}${badge}</mark>`
        )
      }
    })
    return out
  }, [visibleA, teaser])

  const markedB = useMemo(() => {
    let out = visibleB
    teaser.forEach((c, k) => {
      if (!c.quote) return
      if (out.includes(c.quote)) {
        const col = chipColor(c.tag)
        const n = k + 1
        const badge = `<sup data-cidx="${k}" class="cm-badge" style="background:${col.bg};color:${col.fg};border:1px solid ${col.br}">${n}</sup>`
        out = replaceFirst(
          out,
          c.quote,
          `<mark class="cm-hl" data-cidx="${k}" style="background:${col.bg};border:1px solid ${col.br}">${c.quote}${badge}</mark>`
        )
      }
    })
    return out
  }, [visibleB, teaser])

  // Clic pastille/surlignage → toggle + scroll vers la carte via ID (pas de ref)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement
      const el = t.closest?.(".cm-hl, .cm-badge") as HTMLElement | null
      if (!el) return
      const cidx = Number(el.getAttribute("data-cidx"))
      setOpenIdx((cur) => (cur === cidx ? null : cidx))
      const card = document.getElementById(`comment-card-${cidx}`)
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  const justify: React.CSSProperties = { whiteSpace:"pre-wrap", textAlign:"justify" }
  const blur: React.CSSProperties = { filter:"blur(6px)", userSelect:"none" }

  const refId = data.submissionId

  return (
    <section className="panel" style={{ position:"relative" }}>
      <p style={justify} dangerouslySetInnerHTML={{ __html: markedA }} />
      <p style={{ ...justify, ...blur }}>{blurredA}</p>
      <p style={justify} dangerouslySetInnerHTML={{ __html: markedB }} />
      <p style={{ ...justify, ...blur }}>{blurredB}</p>

      {teaser.length > 0 && (
        <aside
          style={{
            position:"sticky", top:10, marginTop:12, marginLeft:"auto",
            maxWidth:420, width:"min(92%, 420px)", display:"grid", gap:12
          }}
        >
          {teaser.map((c, i) => {
            const col = chipColor(c.tag)
            const opened = openIdx === i
            return (
              <div
                key={i}
                id={`comment-card-${i}`}  // ← on scrolle vers cet ID
                style={{
                  border:`1px solid ${col.br}`, background:"#fff", borderRadius:12,
                  boxShadow: opened ? "0 8px 24px rgba(10,26,61,.18)" : "0 2px 12px rgba(10,26,61,.08)",
                  padding:"12px 14px", transition:"box-shadow .2s ease"
                }}
              >
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span
                    className="cm-chip"
                    style={{
                      background:col.bg, color:col.fg, border:`1px solid ${col.br}`,
                      borderRadius:999, padding:"6px 10px", fontWeight:800, fontSize:12, letterSpacing:".2px"
                    }}
                  >
                    {(c.tag || "NOTE").toUpperCase()} • {i+1}
                  </span>
                  {c.quote ? <span style={{ fontStyle:"italic", opacity:.9 }}>&laquo; {c.quote} &raquo;</span> : null}
                </div>
                <div style={{ fontWeight:600, opacity: opened ? 1 : .9 }}>
                  {c.comment || "…"}
                </div>
                <button
                  onClick={() => setOpenIdx(opened ? null : i)}
                  style={{
                    marginTop:8, borderRadius:10, border:`1px solid ${col.br}`,
                    background:"#fff", color:col.fg, fontWeight:800, padding:"6px 10px", cursor:"pointer"
                  }}
                >
                  {opened ? "Masquer" : "Ouvrir le commentaire"}
                </button>
              </div>
            )
          })}
        </aside>
      )}

      {/* Overlay paywall */}
      <div
        style={{
          position:"absolute", inset:0 as any, display:"flex", alignItems:"end",
          justifyContent:"center", pointerEvents:"none"
        }}
        aria-hidden
      >
        <div
          style={{
            pointerEvents:"auto", margin:"0 8px 12px", background:"rgba(255,255,255,.95)",
            border:"1px solid rgba(0,0,0,.06)", borderRadius:12, padding:"14px 16px", boxShadow:"0 10px 30px rgba(0,0,0,.10)"
          }}
        >
          <div style={{ fontWeight:900, marginBottom:6 }}>Débloquer la correction complète</div>
          <div style={{ opacity:.9, marginBottom:10 }}>Accède à tout le texte et à l’ensemble des commentaires.</div>
          <PaymentPanel refId={refId} />
        </div>
      </div>

      <style>{`
        .cm-hl { border-radius: 6px; padding: 0 2px }
        .cm-badge { display:inline-flex; align-items:center; justify-content:center;
          margin-left:4px; width:18px; height:18px; border-radius:999px; font: 700 11px/1 ui-sans-serif,system-ui }
      `}</style>
    </section>
  )
}
