"use client"

import React, { useEffect, useMemo, useState } from "react"
import PaymentPanel from "./PaymentPanel"

type InlineItem = { tag?: string; quote?: string; comment?: string }
type StatusPayload = {
  submissionId: string
  correctionId?: string
  status: "none" | "running" | "ready"
  isUnlocked?: boolean
  result?: {
    normalizedBody?: string
    body?: string
    globalComment?: string
    global_comment?: string
    inline?: InlineItem[]
  } | null
}

function chipStyle(tag?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: ".2px",
    border: "1px solid rgba(0,0,0,.08)",
    background: "#fff",
  }
  const colors: Record<string, React.CSSProperties> = {
    green: { color: "#1b5e20", borderColor: "rgba(27,94,32,.25)", background: "rgba(200,230,201,.35)" },
    red:   { color: "#b71c1c", borderColor: "rgba(183,28,28,.25)", background: "rgba(255,205,210,.35)" },
    orange:{ color: "#e65100", borderColor: "rgba(230,81,0,.25)", background: "rgba(255,224,178,.45)" },
    blue:  { color: "#0d47a1", borderColor: "rgba(13,71,161,.25)", background: "rgba(187,222,251,.45)" },
  }
  return { ...base, ...(colors[(tag || "").toLowerCase()] || {}) }
}

export default function TeaserClient({ submissionId }: { submissionId: string }) {
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)

  // poll /api/corrections/status jusqu'à ready
  useEffect(() => {
    let stop = false
    async function tick() {
      try {
        const res = await fetch(`/api/corrections/status?submissionId=${encodeURIComponent(submissionId)}`, { cache: "no-store" })
        const j = (await res.json()) as StatusPayload
        if (!stop) setData(j)
        // on arrête quand ready, sinon on repoll
        if (!stop && j?.status !== "ready") {
          setTimeout(tick, 1600)
        } else {
          setLoading(false)
        }
      } catch {
        if (!stop) setTimeout(tick, 2000)
      }
    }
    tick()
    return () => { stop = true }
  }, [submissionId])

  const isReady = data?.status === "ready"
  const result = data?.result || undefined
  const body = useMemo(() => (result?.normalizedBody ?? result?.body ?? ""), [result])
  const globalComment = result?.globalComment ?? result?.global_comment ?? ""
  const inline = Array.isArray(result?.inline) ? (result!.inline as InlineItem[]) : []

  // rendu spinner tant que pas prêt
  if (!isReady) {
    return (
      <section
        className="panel"
        style={{ display:"grid", placeItems:"center", minHeight:"26vh", padding:"20px", position:"relative" }}
      >
        <div style={{ display:"grid", placeItems:"center", gap:14, textAlign:"center" }}>
          <div
            aria-label="Chargement en cours"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "3px solid rgba(123,30,58,.25)", borderTopColor: "#7b1e3a",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ whiteSpace:"pre-wrap", textAlign:"center", margin:0, lineHeight:1.5, fontSize:"clamp(18px, 2vw, 22px)" }}>
            Votre correction est en cours de génération… Un aperçu apparaîtra ci-dessous dès qu’il sera prêt.
          </p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
      </section>
    )
  }

  // prêt → aperçu
  const len = body.length
  const part = (r: number) => Math.floor(len * r)
  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))

  const justify: React.CSSProperties = { whiteSpace:"pre-wrap", textAlign:"justify" }
  const blurBlock: React.CSSProperties = { filter:"blur(6px)", pointerEvents:"none", userSelect:"none", position:"relative", zIndex:1 }
  const overlayWrap: React.CSSProperties = {
    position:"absolute", inset:0 as any, display:"flex", alignItems:"center", justifyContent:"center",
    pointerEvents:"none", zIndex:30,
  }
  const burgundyBox: React.CSSProperties = {
    background:"#7b1e3a", color:"#fff", borderRadius:12, padding:"16px 18px",
    boxShadow:"0 10px 30px rgba(10,26,61,.25)", maxWidth:420, width:"92%",
    textAlign:"center", pointerEvents:"auto", border:"1px solid rgba(255,255,255,0.08)",
  }

  const teaserComments = inline.slice(0, 2).filter(Boolean)

  const refId = data?.submissionId || submissionId

  return (
    <section className="panel" style={{ position:"relative" }}>
      {/* texte partiel */}
      <p style={justify}>{start}</p>
      <div style={blurBlock}>
        <p style={justify}>{body.slice(part(0.2), part(0.45))}</p>
      </div>
      <p style={justify}>{middle}</p>
      <div style={blurBlock}>
        <p style={justify}>{body.slice(part(0.55))}</p>
      </div>

      {/* teasers */}
      {teaserComments.length > 0 && (
        <div style={{ marginTop:22 }}>
          <h3 style={{ marginTop:0 }}>Aperçu des commentaires</h3>
          <div style={{ display:"grid", gap:12 }}>
            {teaserComments.map((c, i) => (
              <div key={i}
                   style={{ padding:"12px 14px", borderRadius:12, background:"#fff",
                            border:"1px solid rgba(0,0,0,.06)", boxShadow:"0 2px 12px rgba(10,26,61,.06)" }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                  <span style={chipStyle(c.tag)}>{(c.tag || "").toUpperCase() || "NOTE"}</span>
                  {c.quote ? <span style={{ fontStyle:"italic", opacity:0.9 }}>&laquo; {c.quote} &raquo;</span> : null}
                </div>
                <div style={{ fontWeight:600 }}>{c.comment || "…"}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* commentaire global flouté */}
      {globalComment ? <h3 style={{ marginTop:22 }}>Commentaire global</h3> : null}
      {globalComment ? (
        <div style={blurBlock}>
          <p style={justify}>{globalComment}</p>
        </div>
      ) : null}

      {/* overlay paywall */}
      <div style={overlayWrap} aria-hidden>
        <div style={burgundyBox} aria-label="Débloquer la correction">
          <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: ".3px" }}>
            Débloquer la correction
          </div>
          <div style={{ opacity: 0.95, marginBottom: 12 }}>
            Accède à l’intégralité de ta copie corrigée et à tous les commentaires.
          </div>
          <PaymentPanel refId={refId} />
        </div>
      </div>
    </section>
  )
}
