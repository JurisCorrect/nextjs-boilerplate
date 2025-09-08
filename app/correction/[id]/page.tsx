// app/correction/[id]/page.tsx
import PaymentPanel from "../PaymentPanel"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  "https://pbefzeeizgwdlkmduflt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZ6ZWVpemd3ZGxrbWR1Zmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MjM2MDcsImV4cCI6MjA3MjM5OTYwN30.c4wn7MavFev-TecXUEjz6OBeQz8MGPXSIIARUYVvmc4"
)

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionPage({ params }: Props) {
  const theId = params.id

  // --- Fetch correction ---
  let { data, error } = await supabase
    .from("corrections")
    .select("id, submission_id, result_json")
    .eq("id", theId)
    .single()

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

  if (error || !data) {
    return (
      <main className="page-wrap correction">
        <p style={{ textAlign: "justify" }}>❌ Erreur : correction introuvable.</p>
      </main>
    )
  }

  const result = (data as any).result_json || {}
  const body: string = result?.normalizedBody || ""
  const globalComment: string = result?.globalComment || ""

  const pricing: Array<{ label: string; price: string }> =
    Array.isArray(result?.pricing) && result.pricing.length
      ? result.pricing
      : [
          { label: "Correction unique",  price: "3€" },
          { label: "Pack 5 corrections", price: "5€" },
          { label: "Pack 10 corrections",price: "8€" },
          { label: "Illimité (mensuel)", price: "13€ / mois" },
        ]

  const len = body.length
  const part = (r: number) => Math.floor(len * r)
  const start  = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))

  // --- Styles inline (compatibles Server Component) ---
  const justify: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    textAlign: "justify",
    lineHeight: 1.7,
  }
  const blurBlock: React.CSSProperties = {
    filter: "blur(6px)",
    pointerEvents: "none",
    userSelect: "none",
    position: "relative",
    zIndex: 1,
  }
  const overlayWrap: React.CSSProperties = {
    position: "absolute",
    inset: 0 as any,
    display: "flex",
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
    maxWidth: 380,
    width: "90%",
    textAlign: "center",
    pointerEvents: "auto",
    border: "1px solid rgba(255,255,255,0.08)",
  }

  // On n'utilise PAS .panel pour éviter ton globals.css (qui fixe max-width: 600px !important)
  const correctionPanel: React.CSSProperties = {
    position: "relative",
    maxWidth: "1100px",
    width: "min(1100px, calc(100% - 40px))",
    margin: "2rem auto",
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    border: "1px solid rgba(0,0,0,0.08)",
    padding: 28,
  }

  return (
    <main className="page-wrap correction">
      <h1 className="page-title">CORRECTION</h1>

      {/* Nouvelle classe pour ne pas hériter de .panel global */}
      <section className="correction-panel" style={correctionPanel}>
        {/* "Début" supprimé */}
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

        <div style={overlayWrap} aria-hidden>
          <div style={burgundyBox} aria-label="Débloquer la correction">
            <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: ".3px" }}>
              Débloquer la correction
            </div>
            <div style={{ opacity: 0.95, marginBottom: 10 }}>
              Accédez à l'intégralité de votre copie corrigée.
            </div>
            <PaymentPanel pricing={pricing} />
          </div>
        </div>
      </section>
    </main>
  )
}
