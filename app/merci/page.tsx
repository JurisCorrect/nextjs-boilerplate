export default function MerciPage() {
  return (
    <main className="page-wrap">
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#ffffff'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          Paiement réussi !
        </h1>
        
        <p style={{
          fontSize: '1.3rem',
          marginBottom: '40px',
          opacity: 0.9
        }}>
          Merci pour votre achat. Votre paiement a été traité avec succès.
        </p>

        <div style={{ marginBottom: '40px' }}>
          <a 
            href="/correction-complete"
            style={{
              backgroundColor: '#ffffff',
              color: '#7b1e3a',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.1rem',
              marginRight: '15px'
            }}
          >
            Voir la correction
          </a>
          
          <a 
            href="/"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Retour à l'accueil
          </a>
        </div>

        <p style={{ opacity: 0.8 }}>
          Contactez-nous à <a href="mailto:marie.terki@icloud.com" style={{color: '#ffffff'}}>marie.terki@icloud.com</a>
        </p>
      </div>
    </main>
  )
}
