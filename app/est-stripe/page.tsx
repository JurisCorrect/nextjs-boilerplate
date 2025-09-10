// app/test-stripe/page.tsx
"use client"
import { useState } from "react"

export default function TestStripePage() {
  const [loading, setLoading] = useState<null | "payment" | "subscription">(null)

  const testPayment = async (mode: "payment" | "subscription") => {
    try {
      setLoading(mode)
      console.log("🚀 Test paiement:", mode)

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          submissionId: "test-123",
        }),
      })

      const data = await res.json()
      console.log("📊 Réponse API:", data)

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${data.error || "Inconnu"}`)
      }

      if (!data.url) {
        throw new Error("URL de redirection manquante")
      }

      console.log("✅ Redirection vers Stripe...")
      window.location.href = data.url

    } catch (error: any) {
      console.error("❌ Erreur:", error)
      alert(`ERREUR: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🧪 Test Paiement Stripe</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>Variables d'environnement :</h3>
        <pre style={{ background: "#f5f5f5", padding: "10px", fontSize: "12px" }}>
{`PRICE_ONE: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE || "❌ MANQUANT"}
PRICE_SUB: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB || "❌ MANQUANT"}
PUB_KEY: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) || "❌ MANQUANT"}...`}
        </pre>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <button
          onClick={() => testPayment("payment")}
          disabled={loading !== null}
          style={{
            padding: "15px 20px",
            fontSize: "16px",
            backgroundColor: loading === "payment" ? "#ccc" : "#5469d4",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading === "payment" ? "⏳ Chargement..." : "💳 Tester Paiement Unique (5€)"}
        </button>

        <button
          onClick={() => testPayment("subscription")}
          disabled={loading !== null}
          style={{
            padding: "15px 20px",
            fontSize: "16px",
            backgroundColor: loading === "subscription" ? "#ccc" : "#00d924",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading === "subscription" ? "⏳ Chargement..." : "📅 Tester Abonnement (12,99€/mois)"}
        </button>
      </div>

      <div style={{ marginTop: "30px", fontSize: "14px", color: "#666" }}>
        <p><strong>Instructions :</strong></p>
        <ol>
          <li>Vérifiez que les variables d'env s'affichent correctement ci-dessus</li>
          <li>Cliquez sur un bouton de test</li>
          <li>Vous devriez être redirigé vers Stripe Checkout</li>
          <li>Utilisez la carte test : 4242 4242 4242 4242</li>
        </ol>
      </div>
    </div>
  )
}
