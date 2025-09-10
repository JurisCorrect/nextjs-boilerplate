export default function PaiementConfirmePage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#7b1e3a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>
          Paiement réussi !
        </h1>
        <p style={{ marginBottom: '30px' }}>
          Merci pour votre achat.
        </p>
        <a 
          href="/"
          style={{
            backgroundColor: 'white',
            color: '#7b1e3a',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Retour à l'accueil
        </a>
      </div>
    </div>
  )
}
