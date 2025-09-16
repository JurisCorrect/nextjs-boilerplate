// app/correction/[id]/page.tsx
import PaymentPanel from "../PaymentPanel"
import PaywallStatus from "@/components/PaywallStatus"
import { getSupabaseServer } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionPage({ params }: Props) {
  const theId = params.id
  const supabase = getSupabaseServer()

  // Auth requise (sinon même rendu qu’avant mais on bloque l’accès aux données)
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth?.user?.id || null

  // 1) On essaie d'abord par correction.id
  let { data: corr, error } = await supabase
    .from("corrections")
    .select("id, submission_id, status, result_json, submissions!inner(id, user_id, paid)")
    .eq("id", theId)
    .maybeSingle()

  // 2) Fallback : si l'URL est /correction/[submissionId]
  if ((!corr || error) && theId) {
    const bySubmission = await supabase
      .from("corrections")
      .select("id, submission_id, status, result_json, submissions!inner(id, user_id, paid)")
      .eq("submission_id", theId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (bySubmission.data && !bySubmission.error) {
      corr = bySubmission.data
      error = null as any
    }
  }

  // Si rien trouvé → page d’attente (avec polling PaywallStatus)
  if (!corr) {
    return (
      <main className="page-wrap correction">
        <h1 className="page-title">CORRECTION</h1>
        <section className="panel">
          <div className="blur">
            <p style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}>
              Votre correction est en cours de génération… Un aperçu gratuit des commentaires
              apparaîtra ci-dessous dès qu’il sera prêt.
            </p>
          </div>
          <PaywallStatus submissionId={theId} />
        </section>
      </main>
    )
  }

  // Sécurité : seul le propriétaire voit la correction
  const ownerId = (corr as any)?.submissions?.user_id
  if (!userId || ownerId !== userId) {
    return (
      <main className="page-wrap correction">
        <h1 className="page-title">CORRECTION</h1>
        <section className="panel">
          <p>Accès refusé.</p>
        </section>
      </main>
    )
  }

  const paid: boolean = Boolean((corr as any)?.submissions?.paid)
  const status: string = (corr as any)?.status || "running"
  const isReady = status === "ready"

  // Champs possibles selon ta génération
  const result = (corr as any)?.result_json || {}
  const body: string =
    result?.normalizedBody ??
    result?.body ??
    ""
  const globalComment: string =
    result?.globalComment ??
    result?.global_comment ??
    ""

  const justify: React.CSSProperties = { whiteSpace: "pre-wrap", textAlign: "justify" }
  const blurBlock: React.CSSProperties = paid && isReady
    ? { filter: "none" }
    : { filter: "blur(6px)", pointerEvents: "none", userSelect: "none", position: "relative", zIndex: 1 }
  const overlayWrap: React.CSSProperties = {
    position: "absolute",
    inset: 0 as any,
    display: paid && isReady ? "none" : "flex",
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

  // Si pas encore prêt, on garde le même comportement que chez toi : rendu flouté + PaywallStatus en dessous.
  // Si payé + prêt → on défloute (overlay masqué automatiquement).
  const len = body.length
  const part = (r: number) => Math.floor(len * r)
  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))
  const refId = (corr as any).submission_id || (corr as any).id || theId
  const submissionId: string = (corr as any).submission_id || theId

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

        {/* Paywall overlay (caché automatiquement si payé + prêt) */}
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

      {/* Extraits gratuits + statut (inchangé), utile tant que ce n’est pas prêt */}
      {!paid || !isReady ? <PaywallStatus submissionId={submissionId} /> : null}
    </main>
  )
}
