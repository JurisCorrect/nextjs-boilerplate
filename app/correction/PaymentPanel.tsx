// app/correction/PaymentPanel.tsx
"use client"
import { useState } from "react"

type Props = { refId: string }

export default function PaymentPanel({ refId }: Props) {
  const [loading, setLoading] = useState<null | "one" | "sub">(null)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async (mode: "payment" | "subscription") => {
    if (loading !== null) return
    
    try {
      setLoading(mode === "payment" ? "one" : "sub")
      setError(null)
      
      // Petit délai pour éviter les conflits
      await new Promise(resolve => setTimeout(resolve, 50))
      
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          submissionId: refId,
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData?.error || `Erreur ${res.status}`)
      }
      
      const data = await res.json()
      
      if (!data?.url) {
        throw new Error("URL de redirection manquante")
      }
      
      // Méthode de redirection la plus compatible
      await new Promise(resolve => setTimeout(resolve, 100))
      location.assign(data.url)
      
    } catch (e: any) {
      setError(e?.message || "Erreur de connexion")
    } finally {
      setLoading(null)
    }
  }

  const handleClick = (mode: "payment" | "subscription") => {
    // Protection supplémentaire
    if (loading) return
    startCheckout(mode)
  }

  const buttonStyle = {
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
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  }

  const disabledStyle = {
    ...buttonStyle,
    opacity: 0.6,
    cursor: "default",
    pointerEvents: "none" as const,
  }

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
      
      <button 
        style={loading !== null ? disabledStyle : buttonStyle}
        onClick={() => handleClick("payment")}
        disabled={loading !== null}
        type="button"
      >
        <span style={{ textAlign: "left" }}>
          <div>Correction unique</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>paiement unique</div>
        </span>
        <strong>{loading === "one" ? "..." : "5€"}</strong>
      </button>
      
      <button 
        style={loading !== null ? disabledStyle : buttonStyle}
        onClick={() => handleClick("subscription")}
        disabled={loading !== null}
        type="button"
      >
        <span style={{ textAlign: "left" }}>
          <div>Illimité (mensuel)</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>annulable à tout moment</div>
        </span>
        <strong>{loading === "sub" ? "..." : "12,99€ / mois"}</strong>
      </button>
    </div>
  )
}
