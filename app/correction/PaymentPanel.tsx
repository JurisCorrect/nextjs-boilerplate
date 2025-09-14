// app/correction/PaymentPanel.tsx
"use client"
import { useState } from "react"

type Props = { refId: string }

export default function PaymentPanel({ refId }: Props) {
  const [loading, setLoading] = useState<null | "one" | "sub">(null)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async (mode: "payment" | "subscription") => {
    console.log("🚀 1. Début startCheckout, mode:", mode)
    
    if (loading !== null) {
      console.log("❌ Déjà en cours de chargement, abandon")
      return
    }

    try {
      console.log("⏳ 2. setLoading...")
      setLoading(mode === "payment" ? "one" : "sub")
      setError(null)
      
      console.log("🔄 3. Avant fetch API")
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          submissionId: refId,
        }),
      })
      
      console.log("📡 4. Fetch terminé, status:", res.status)
      const data = await res.json()
      console.log("📦 5. Data reçue:", data)
      
      if (!res.ok || !data?.url) {
        console.log("❌ 6. Erreur dans la réponse")
        throw new Error(data?.error || "Erreur Checkout")
      }
      
      console.log("✅ 7. Tout OK, URL:", data.url)
      console.log("🔗 8. Avant redirection...")
      
      // Temporairement : juste alerter au lieu de rediriger
      alert("REDIRECTION VERS: " + data.url)
      console.log("🎯 9. Alert affiché, pas de redirection pour test")
      
      // Redirection commentée pour diagnostic
      // const link = document.createElement('a')
      // link.href = data.url
      // link.target = '_self'
      // document.body.appendChild(link)
      // link.click()
      // document.body.removeChild(link)
      
    } catch (e: any) {
      console.error("💥 ERREUR dans catch:", e)
      setError(e?.message || "Erreur de connexion. Réessayez.")
    } finally {
      console.log("🏁 10. Finally - reset loading")
      setLoading(null)
    }
  }

  const Btn = (props: any) => (
    <button
      {...props}
      onClick={(e) => {
        console.log("👆 CLIC bouton détecté")
        if (props.onClick) props.onClick(e)
      }}
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
