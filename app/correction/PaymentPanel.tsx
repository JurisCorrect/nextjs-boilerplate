// app/correction/PaymentPanel.tsx
"use client"
import { useState } from "react"

type Props = { refId: string }

export default function PaymentPanel({ refId }: Props) {
  const [loading, setLoading] = useState<null | "one" | "sub">(null)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async (mode: "payment" | "subscription") => {
    try {
      setLoading(mode === "payment" ? "one" : "sub")
      setError(null) // Reset error
      
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          submissionId: refId,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Erreur Checkout")
      }
      
      window.location.href = data.url
      
    } catch (e: any) {
      console.error("Erreur paiement:", e)
      setError(e?.message || "Erreur de connexion. Réessayez.")
    } finally {
      setLoading(null)
    }
  }

  const Btn = (props: any) => (
    <button
      {...props}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "16px 18px",
        margin: "10px 0",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff",
        fontWeight: 700,
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.6 : 1,
      }}
    />
  )

  return (
    <div>
      {error && (
        <div style={{
          background: "rgba(255, 59, 48, 0.1)",
          border: "1px solid rgba(255, 59, 48, 0.3)",
          borderRadius: 8,
          padding: "12px",
          marginBottom: "12px",
          color: "#ff3b30",
          fontSize: "14px",
          textAlign: "center"
        }}>
          {error}
        </div>
      )}
      
      <Btn 
        onClick={() => startCheckout("payment")} 
        disabled={loading !== null}
      >
        <span style={{ textAlign: "left" }}>
          <div>Correction unique</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>paiement unique</div>
        </span>
        <strong>{loading === "one" ? "..." : "5€"}</strong>
      </Btn>
      
      <Btn 
        onClick={() => startCheckout("subscription")} 
        disabled={loading !== null}
      >
        <span style={{ textAlign: "left" }}>
          <div>Illimité (mensuel)</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>annulable à tout moment</div>
        </span>
        <strong>{loading === "sub" ? "..." : "12,99€ / mois"}</strong>
      </Btn>
    </div>
  )
}
