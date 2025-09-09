"use client"

type Props = { refId: string }

export default function PaymentPanel({ refId }: Props) {
  return (
    <div>
      <div style={{color: 'lime', fontSize: '14px', marginBottom: '15px'}}>NOUVEAU PaymentPanel v3.0</div>
      
      <button style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 18px", margin: "10px 0", borderRadius: 12,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff", fontWeight: 700, cursor: "pointer"
      }}>
        <span>
          <div>NOUVEAU - Correction unique</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>paiement unique</div>
        </span>
        <strong>5€</strong>
      </button>

      <button style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 18px", margin: "10px 0", borderRadius: 12,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        color: "#fff", fontWeight: 700, cursor: "pointer"
      }}>
        <span>
          <div>NOUVEAU - Illimité mensuel</div>
          <div style={{ fontWeight: 400, opacity: 0.9 }}>annulable à tout moment</div>
        </span>
        <strong>12,99€ / mois</strong>
      </button>
    </div>
  )
}
