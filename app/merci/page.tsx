import React from "react"

export default function MerciPage() {
  return (
    <main className="page-wrap">
      <div style={{
        minHeight: '100vh',
        background: '#7b1e3a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24
      }}>
        <div style={{ maxWidth: 720, width: '100%' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Paiement réussi !</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.95, marginBottom: 28 }}>
            Merci pour votre achat. Votre paiement a bien été traité.
          </p>
          
          <div style={{
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 28
          }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              Et maintenant ?
            </h3>
            <p style={{ textAlign: 'left', lineHeight: 1.8, fontSize: 16, margin: 0 }}>
              Un email de confirmation vous a été envoyé.<br/>
              Votre correction est maintenant accessible.<br/>
              Support : marie.terki@icloud.com
            </p>
          </div>

          
            href="/correction-complete"
            style={{
              background: '#fff',
              color: '#7b1e3a',
              padding: '14px 20px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 16,
              marginRight: 14,
              display: 'inline-block'
            }}
          >
            Voir la correction
          </a>
        </div>
      </div>
    </main>
  )
}
