// app/correction/[id]/page.tsx
import PaymentPanel from "../PaymentPanel"
import PaywallStatus from "@/components/PaywallStatus"

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionPage({ params }: Props) {
  const theId = params.id

  // URL de base pour l'appel serveur -> API status
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
    "http://localhost:3000"

  let corr:
    | { id: string; submission_id: string; status: string; result_json?: any }
    | null = null

  try {
    const r = await fetch(
      `${base}/api/corrections/status?submissionId=${encodeURIComponent(theId)}`,
      { cache: "no-store" }
    )
    if (r.ok) {
      const s = await r.json()
      if (s?.status === "ready") {
        corr = {
          id: s.correctionId,
          submission_id: s.submissionId || theId,
          status: "ready",
          result_json: s.result || {},
        }
      }
    }
  } catch {
    // corr reste null -> spinner + polling côté client
  }

  // ───────────────────────────────────────────────────────────────
  // PAS PRÊT → spinner + composant qui poll
  // ───────────────────────────────────────────────────────────────
  if (!corr) {
    return (
      <main className="page-wrap correction">
        <h1 className="page-title">CORRECTION</h1>

        <section
          className="panel"
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "26vh",
            padding: "20px",
            position: "relative",
          }}
        >
          <div style={{ display: "grid", placeItems: "center", gap: 14, textAlign: "center" }}>
            <div
              aria-label="Chargement en cours"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "3px solid rgba(123,30,58,.25)",
                borderTopColor: "#7b1e3a",
                animation: "spin 1s linear infinite",
              }}
            />
            <p
              style={{
                whiteSpace: "pre-wrap",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.5,
                fontSize: "clamp(18px, 2vw, 22px)",
              }}
            >
              Votre correction est en cours de génération…{" "}
              Un aperçu apparaîtra ci-dessous dès qu’il sera prêt.
            </p>
          </div>

          {/* Polling côté client : bascule automatiquement dès que c’est prêt */}
          <div style={{ width: "100%", marginTop: 18 }}>
            <PaywallStatus submissionId={theId} />
          </div>

          <style>{`
            @keyframes spin { 
              from { transform: rotate(0deg); } 
              to { transform: rotate(360deg); } 
            }
          `}</style>
        </section>
      </main>
    )
  }

  // ───────────────────────────────────────────────────────────────
  // PRÊT → afficher texte partiel + TEASERS de commentaires
  // ───────────────────────────────────────────────────────────────
  const paid = false // paywall actif tant que pas payé (tu brancheras sur ta logique)
  const status: string = corr.status || "running"
  const isReady = status === "ready"

  const result = corr.result_json || {}
  const body: string = result?.normalizedBody ?? result?.body ?? ""
  const globalComment: string = result?.globalComment ?? result?.global_comment ?? ""
  const inline: Array<{ tag?: string; quote?: string; comment?: string }> = Array.isArray(result?.inline)
    ? result.inline
    : []

  // Prend 2 commentaires courts et parlants pour teaser
  const teaserComments = inline.slice(0, 2).filter(Boolean)

  const justify: React.CSSProperties = { whiteSpace: "pre-wrap", textAlign: "justify" }
  const blurBlock: React.CSSProperties =
    paid && isReady
      ? { filter: "none" }
      : { filter: "blur(6px)", pointerEvents: "none", userSelect: "none", position: "relative", zIndex: 1 }
  const overlayWrap: React.CSSProperties = {
    position: "absolute",
    inset: 0 as any,
    display: paid && isReady ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    zIndex: 30,
  }
  const burgundyBox: React.CSSProperties = {
    background: "#7b1e3a",
    color: "#fff",
    borderRadius: 12,
    padding: "16px 18px",
    boxShadow: "0 10px 30px rgba(10,26,61,.25)",
    maxWidth: 420,
    width: "92%",
    textAlign: "center",
    pointerEvents: "auto",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  // Rendu partiel du texte (non flouté / flouté / non flouté / flouté…)
  const len = body.length
  const part = (r: number) => Math.floor(len * r)
  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))
  const refId = corr.submission_id || corr.id || theId
  const submissionId: string = corr.submission_id || theId

  // Styles chips tags (teasers)
  const chipStyle = (tag?: string): React.CSSProperties => {
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

  return (
    <main className="page-wrap correction">
      <h1 className="page-title">CORRECTION</h1>

      <section className="panel" style={{ position: "relative" }}>
        {/* --- Texte partiel, alternance visible / flouté --- */}
        <p style={justify}>{start}</p>
        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.2), part(0.45))}</p>
        </div>
        <p style={justify}>{middle}</p>
        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.55))}</p>
        </div>

        {/* --- Teasers de commentaires (visibles même si paywall) --- */}
        {teaserComments.length > 0 && (
          <div style={{ marginTop: 22 }}>
            <h3 style={{ marginTop: 0 }}>Aperçu des commentaires</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {teaserComments.map((c, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: "#fff",
                  border: "1px solid rgba(0,0,0,.06)", boxShadow: "0 2px 12px rgba(10,26,61,.06)" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={chipStyle(c.tag)}>{(c.tag || "").toUpperCase() || "NOTE"}</span>
                    {c.quote ? (
                      <span style={{ fontStyle: "italic", opacity: 0.9 }}>&laquo; {c.quote} &raquo;</span>
                    ) : null}
                  </div>
                  <div style={{ fontWeight: 600 }}>{c.comment || "…"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Commentaire global (flouté tant que pas payé) --- */}
        {globalComment ? <h3 style={{ marginTop: 22 }}>Commentaire global</h3> : null}
        {globalComment ? (
          <div style={blurBlock}>
            <p style={justify}>{globalComment}</p>
          </div>
        ) : null}

        {/* Paywall overlay (caché si payé + prêt) */}
        <div style={overlayWrap} aria-hidden>
          <div style={burgundyBox} aria-label="Débloquer la correction">
            <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: ".3px" }}>
              Débloquer la correction
            </div>
            <div style={{ opacity: 0.95, marginBottom: 12 }}>
              Accède à l&apos;intégralité de ta copie corrigée et à tous les commentaires.
            </div>
            <PaymentPanel refId={refId} />
          </div>
        </div>
      </section>
       {/* Statut/polling uniquement PENDANT la génération */}
      {!isReady ? <PaywallStatus submissionId={submissionId} /> : null}
    </main>
  )
}

     
