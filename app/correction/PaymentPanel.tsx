"use client"
import { useState } from "react"

type PackId = "pack5" | "pack10" | "monthly"

// 👉 Tarifs demandés
const PACKS: { id: PackId; title: string; price: string; note?: string }[] = [
  { id: "pack5",  title: "Pack 5 corrections",  price: "5 €",  note: "débloque 5 copies" },
  { id: "pack10", title: "Pack 10 corrections", price: "8 €",  note: "débloque 10 copies" },
  { id: "monthly",title: "Illimité mensuel",    price: "13 €/mois", note: "annulable à tout moment" },
]

export default function PaymentPanel() {
  const [loading, setLoading] = useState<PackId | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function buy(pack: PackId) {
    try {
      setError(null)
      setLoading(pack)
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }) // userId optionnel : l’API accepte 'guest'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur paiement")
      if (!data?.url) throw new Error("URL de paiement introuvable")
      // 👉 Redirection vers la plateforme de paiement (Stripe Checkout)
      window.location.href = data.url
    } catch (e: any) {
      setError(e.message || "Erreur inconnue")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      aria-label="Débloquer la correction"
      style={{ display: "grid", gap: 10, minWidth: 280 }}
    >
      <div style={{ fontWeight: 900, textAlign: "center", marginBottom: 4 }}>
        Débloquer la correction
      </div>
      <div style={{ fontSize: 13, opacity: 0.9, textAlign: "center", marginBottom: 8 }}>
        Merci d’avoir regardé cette vidéo ! Choisis une offre pour accéder à l’intégralité.
      </div>

      {PACKS.map((p) => (
        <button
          key={p.id}
          onClick={() => buy(p.id)}
          disabled={!!loading}
          aria-label={`Choisir ${p.title}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 12,
            background: loading === p.id ? "#6b1a33" : "#7b1e3a", // bordeaux
            color: "#fff",
            padding: "12px 14px",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 6px 18px rgba(10,26,61,.22)",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800 }}>{p.title}</div>
            {p.note && <div style={{ fontSize: 12, opacity: 0.9 }}>{p.note}</div>}
          </div>
          <div style={{ fontWeight: 900 }}>{p.price}</div>
        </button>
      ))}

      {error && (
        <div style={{ color: "#b91c1c", fontWeight: 700, textAlign: "center", marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  )
}
