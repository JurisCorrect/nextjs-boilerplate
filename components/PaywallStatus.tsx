"use client";
import { useEffect, useState } from "react";

type Preview = {
  inline: { tag: "green"|"red"|"orange"|"blue"; quote: string; comment: string }[];
  global_intro: string;
  score?: { overall?: number; out_of?: number } | null;
};

export default function PaywallStatus({ submissionId }: { submissionId: string }) {
  const [status, setStatus] = useState<"queued"|"running"|"ready">("queued");
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    let t: any;
    async function tick() {
      const res = await fetch(`/api/corrections/status?submissionId=${submissionId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.status) setStatus(data.status);
      if (data.preview) setPreview(data.preview);
      if (data.correctionId) setCorrectionId(data.correctionId);
      if (data.status === "ready") clearInterval(t);
    }
    tick();
    t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, [submissionId]);

  return (
    <div>
      {/* 1) Ton gros rendu élève (laisse ton floutage existant ici) */}
      <div className="blur">
        {/* ... ton aperçu flouté déjà en place ... */}
      </div>

      {/* 2) Extraits gratuits */}
      {preview && (
        <div className="card-glass" style={{ padding: 12, marginTop: 12 }}>
          <p style={{ color: "#fff", marginTop: 0, fontWeight: 700 }}>
            Aperçu de la correction (extraits)
          </p>
          {preview.score?.overall != null && (
            <p style={{ color: "#fff", margin: "6px 0" }}>
              Note indicative : <strong>{preview.score.overall}</strong> / {preview.score.out_of ?? 20}
            </p>
          )}
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {preview.inline.map((it, i) => (
              <li key={i} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    title={it.tag}
                    style={{
                      width: 14, height: 14, borderRadius: 4, display: "inline-block",
                      background: it.tag === "green" ? "#16a34a"
                        : it.tag === "red" ? "#dc2626"
                        : it.tag === "orange" ? "#ea580c" : "#2563eb",
                    }}
                  />
                  <em style={{ color: "var(--muted)" }}>« {it.quote} »</em>
                </div>
                <p style={{ color: "#fff", marginTop: 6 }}>{it.comment}</p>
              </li>
            ))}
          </ul>
          {preview.global_intro && (
            <p style={{ color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>
              {preview.global_intro}…
            </p>
          )}
        </div>
      )}

      {/* 3) Lien quand prêt */}
      {status === "ready" && correctionId && (
        <a href={`/corrections/${correctionId}`} className="btn btn-primary" style={{ marginTop: 12 }}>
          Voir la correction
        </a>
      )}
    </div>
  );
}
