// app/correction/PaymentPanel.tsx
"use client"
import { useState } from "react"

type PackId = "single" | "pack10" | "monthly"

type PricingProp = { label: string; price: string } // ce que la page passe

// 👉 Toggle central : quand on branchera Stripe, passe à true
const ENABLE_CHECKOUT = false

// Fallback interne (si aucune prop `pricing` n'est fournie)
const PACKS_DEFAULT: { id: PackId; title: string; price: string; note?: string }[] = [
  { id: "single",  title: "Correction de ce document", price: "3 €",  note: "paiement unique" },
  { id: "pack10",  title: "10 corrections",            price: "5 €",  note: "débloque 10 copies" },
  { id: "monthly", title: "Illimité mensuel",          price: "13 €/mois", note: "annulable à tout moment" },
]

// Déduit un id de pack en fonction du libellé (utile si `pricing` ne fournit pas d'id)
function inferIdFromLabel(label: string): PackId {
  const l = label.toLowerCase()
  if (l.includes("illimité")) return "monthly"
  if (l.includes("10")) return "pack10"
  return "single"
}

export default function PaymentPanel({ pricing }: { pricing?: PricingProp[] }) {
  const [loading, setLoading] = useState<PackId | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Si `pricing` est fourni par la page, on le convertit au format interne ; sinon on prend le fallback
  const PACKS = Array.isArray(pricing) && pricing.length
    ? pricing.map(p => {
        const id = inferIdFromLabel(p.label)
        const note =
          id === "single"  ? "paiement unique" :
          id === "pack10"  ? "débloque 10 copies" :
          /* monthly */       "annulable à tout moment"
        return { id, title: p.label, price: p.price, note }
      })
    : PACKS_DEFAULT

  async function buy(pack: PackId) {
    try {
      setError(null)

      // Pour l’instant, pas de paiement actif
      if (!ENABLE_CHECKOUT) {
        setError("Paiement bientôt disponible")
        return
      }

      setLoading(pack)
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }), // "single" | "pack10" | "monthly"
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur paiement")
      if (!data?.url) throw new Error("URL de paiement introuvable")
      window.location.href = data.url
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div aria-label="Choisir une offre" style={{ display: "grid", gap: 10, minWidth: 280 }}>
      {PACKS.map((p) => (
        <button
          key={p.id}
          onClick={() => buy(p.id)}
          disabled={!!loading || !ENABLE_CHECKOUT}
          aria-label={`Choisir ${p.title}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 12,
            background: (loading === p.id) ? "#6b1a33" : "#7b1e3a",
            opacity: (!ENABLE_CHECKOUT ? 0.85 : 1),
            color: "#fff",
            padding: "12px 14px",
            cursor: (!ENABLE_CHECKOUT || loading) ? "not-allowed" : "pointer",
            boxShadow: "0 6px 18px rgba(10,26,61,.22)",
          }}
          title={!ENABLE_CHECKOUT ? "Paiement bientôt disponible" : undefined}
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
