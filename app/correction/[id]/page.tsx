// app/correction/[id]/page.tsx
import PaymentPanel from "../PaymentPanel";
import PaywallStatus from "@/components/PaywallStatus";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function CorrectionPage({ params }: Props) {
  const theId = params.id;

  // On tente de récupérer l'état côté serveur via l'API status (URL absolue)
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
    "http://localhost:3000";

  let corr: { id: string; submission_id: string; status: string; result_json?: any } | null = null;

  try {
    const r = await fetch(
      `${base}/api/corrections/status?submissionId=${encodeURIComponent(theId)}`,
      { cache: "no-store" }
    );
    if (r.ok) {
      const s = await r.json();
      if (s?.status === "ready") {
        corr = {
          id: s.correctionId,
          submission_id: theId,
          status: "ready",
          result_json: s.result || {},
        };
      }
    }
  } catch {
    // on laisse corr = null → l’UI affiche le spinner + PaywallStatus (polling client)
  }

  // ───────────────────────────────────────────────────────────────
  // PAS DE CORRECTION PRÊTE → spinner + PaywallStatus (polling)
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

          <div style={{ width: "100%", marginTop: 18 }}>
            {/* Côté client, PaywallStatus poll /api/corrections/status et affiche l’aperçu */}
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
    );
  }

  // ───────────────────────────────────────────────────────────────
  // CORRECTION READY (aperçu) — le défloutage complet se fait après paiement
  // ───────────────────────────────────────────────────────────────

  // NOTE : tant que tu n’as pas une colonne "paid" fiable, on garde paid = false (paywall actif)
  const paid = false;
  const status = corr.status || "running";
  const isReady = status === "ready";

  const result = corr.result_json || {};
  const body: string = result?.normalizedBody ?? result?.body ?? "";
  const globalComment: string = result?.globalComment ?? result?.global_comment ?? "";

  const justify: React.CSSProperties = { whiteSpace: "pre-wrap", textAlign: "justify" };
  const blurBlock: React.CSSProperties =
    paid && isReady
      ? { filter: "none" }
      : { filter: "blur(6px)", pointerEvents: "none", userSelect: "none", position: "relative", zIndex: 1 };
  const overlayWrap: React.CSSProperties = {
    position: "absolute",
    inset: 0 as any,
    display: paid && isReady ? "none" : "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    zIndex: 30,
  };
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
  };

  const len = body.length;
  const part = (r: number) => Math.floor(len * r);
  const start = body.slice(0, part(0.2));
  const middle = body.slice(part(0.45), part(0.55));
  const refId = corr.submission_id || corr.id || theId;
  const submissionId: string = corr.submission_id || theId;

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

      {/* Extraits + statut tant que non payé ou pas prêt */}
      {!paid || !isReady ? <PaywallStatus submissionId={submissionId} /> : null}
    </main>
  );
}
