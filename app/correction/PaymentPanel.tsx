"use client"
import { useState } from "react"
import { useSession } from "../lib/useSession"

export default function PaymentPanel() {
  const [loading, setLoading] = useState<string | null>(null)
  const session = useSession()
  const userId = session?.user?.id

  const go = async (pack: 'pack5'|'pack10'|'monthly') => {
    if (!userId) { alert("Connecte-toi d'abord (menu Connexion)."); return; }
    setLoading(pack)
    const res = await fetch('/api/checkout', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ pack, userId })
    })
    const data = await res.json()
    setLoading(null)
    if (data.url) window.location.href = data.url
    else alert(data.error || 'Erreur de redirection paiement')
  }

  return (
    <div className="panel" style={{ marginTop:16 }}>
      <h3>Débloquer la correction</h3>
      <div className="buy-grid">
        <button className="btn-buy" onClick={()=>go('pack5')} disabled={!!loading}>
          <strong>5 corrections</strong><span>3,00 €</span>
        </button>
        <button className="btn-buy" onClick={()=>go('pack10')} disabled={!!loading}>
          <strong>10 corrections</strong><span>8,00 €</span>
        </button>
        <button className="btn-buy" onClick={()=>go('monthly')} disabled={!!loading}>
          <strong>Illimité / mois</strong><span>12,00 €</span>
        </button>
      </div>
      {loading && <p>Redirection vers le paiement…</p>}
    </div>
  )
}
