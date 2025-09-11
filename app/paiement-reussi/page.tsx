export default function PaiementReussiPage() {
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
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 16 }}>Paiement réussi !</h1>
          <p style={{ marginBottom: 24 }}>Merci pour votre achat. Votre paiement a bien été traité.</p>
          
            href="/correction-complete"
            style={{
              background: '#fff',
              color: '#7b1e3a',
              padding: '12px 20px',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-block',
              marginTop: 16
            }}
          >
            Voir la correction
          </a>
        </div>
      </div>
    </main>
  )
}
