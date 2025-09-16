// app/correction/[id]/page.tsx
import PaymentPanel from "../PaymentPanel"
import { createClient } from "@supabase/supabase-js"
import PaywallStatus from "@/components/PaywallStatus" // ← AJOUT

const supabase = createClient(
  "https://pbefzeeizgwdlkmduflt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4"
)

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionPage({ params }: Props) {
  const theId = params.id

  let { data, error } = await supabase
    .from("corrections")
    .select("id, submission_id, result_json")
    .eq("id", theId)
    .single()

  // fallback: si l'URL contient submissionId
  if (error || !data) {
    const bySubmission = await supabase
      .from("corrections")
      .select("id, submission_id, result_json")
      .eq("submission_id", theId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!bySubmission.error && bySubmission.data) {
      data = bySubmission.data
      error = null as any
    }
  }

  // Détermine le submissionId à passer au composant de polling
  const submissionId: string = (data as any)?.submission_id || theId

  // Styles utilitaires existants
  const justify: React.CSSProperties = { whiteSpace: "pre-wrap", textAlign: "justify" }
  const blurBlock: React.CSSProperties = {
    filter: "blur(6px)",
    pointerEvents: "none",
    userSelect: "none",
    position: "relative",
    zIndex: 1
  }
  const overlayWrap: React.CSSProperties = {
    position: "absolute",
    inset: 0 as any,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    zIndex: 30
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
    border: "1px solid rgba(255,255,255,0.08)"
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAS 1 : la correction n'est PAS encore en base → on affiche une page d'attente
  // avec le composant PaywallStatus qui poll /api/corrections/status
  // ─────────────────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <main className="page-wrap correction">
        <h1 className="page-title">CORRECTION</h1>

        {/* Ici tu peux mettre un "squelette" flouté minimal si tu veux */}
        <section className="panel">
          <div className="blur">
            <p style={justify}>
              Votre correction est en cours de génération… Un aperçu gratuit des commentaires
              apparaîtra ci-dessous dès qu’il sera prêt.
            </p>
          </div>

          {/* EXTRATS + STATUT + bouton "Voir la correction" quand prêt */}
          <PaywallStatus submissionId={submissionId} />
        </section>
      </main>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CAS 2 : la correction existe → on affiche ton rendu flouté + paywall + extraits
  // ─────────────────────────────────────────────────────────────────────────────
  const result = (data as any).result_json || {}
  const body: string = result?.normalizedBody || ""
  const globalComment: string = result?.globalComment || ""

  const len = body.length
  const part = (r: number) => Math.floor(len * r)
  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))

  const refId = (data as any).submission_id || (data as any).id || theId

  return (
    <main className="page-wrap correction">
      <h1 className="page-title">CORRECTION</h1>

      <section className="panel" style={{ position: "relative" }}>
        <p style={justify}>{start}</p>
        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.2), part(0.45))}</p>
        </div>
        <p style={justify}>{middle}</p>
        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.55))}</p>
        </div>

        <h3>Commentaire global</h3>
        <div style={blurBlock}>
          <p style={justify}>{globalComment}</p>
        </div>

        {/* Paywall overlay */}
        <div style={overlayWrap} aria-hidden>
          <div style={burgundyBox} aria-label="Débloquer la correction">
            <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: ".3px" }}>
              Débloquer la correction
            </div>
            <div style={{ opacity: 0.95, marginBottom: 12 }}>
              Accède à l&apos;intégralité de ta copie corrigée.
            </div>
            <PaymentPanel refId={refId} />
          </div>
        </div>
      </section>

      {/* EXTRATS GRATUITS + statut en dessous de ton bloc flouté */}
      <PaywallStatus submissionId={submissionId} />
    </main>
  )
}
