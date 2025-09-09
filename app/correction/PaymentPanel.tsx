"use client"
import { useState } from "react"

type Props = { refId: string }

export default function PaymentPanel({ refId }: Props) {
  const [loading, setLoading] = useState<null | "one" | "sub">(null)

  const startCheckout = async (mode: "payment" | "subscription") => {
    try {
      setLoading(mode === "payment" ? "one" : "sub")
      const priceId =
        mode === "payment"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB
      if (!priceId) throw new Error("Price ID manquant.")

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          priceId,
          clientReferenceId: refId,
          metadata: { kind: "correction" },
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.url) throw new Error(data?.error || "Erreur Checkout")
      window.location.href = data.url
    } catch (e: any) {
      alert(e?.message || String(e))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <button 
        onClick={() => startCheckout("payment")} 
        disabled={loading !== null}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", margin: "10px 0", borderRadius: 12,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        <span style={{ textAlign: "left" }}>
          <div>Correction unique</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>paiement unique</div>
        </span>
        <strong>5€</strong>
      </button>

      <button 
        onClick={() => startCheckout("subscription")} 
        disabled={loading !== null}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", margin: "10px 0", borderRadius: 12,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer"
        }}
      >
        <span style={{ textAlign: "left" }}>
          <div>Illimité (mensuel)</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>annulable à tout moment</div>
        </span>
        <strong>12,99€ / mois</strong>
      </button>
    </div>
  )
}
