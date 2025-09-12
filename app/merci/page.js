export default function MerciPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#7b1e3a',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '720px', width: '100%' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '12px' }}>Paiement réussi !</h1>
        <p style={{ fontSize: '18px', lineHeight: '1.6', opacity: '0.95', marginBottom: '28px' }}>
          Merci pour votre achat. Votre paiement a bien été traité.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.20)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px'
        }}>
          <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
            Et maintenant ?
          </h3>
          <div style={{ textAlign: 'left', lineHeight: '1.8', fontSize: '16px' }}>
            <div>• Un email de confirmation vous a été envoyé.</div>
            <div>• Votre correction est maintenant accessible.</div>
            <div>• Support : marie.terki@icloud.com</div>
          </div>
        </div>

        <div>
          
            href="/correction-complete"
            style={{
              background: '#fff',
              color: '#7b1e3a',
              padding: '14px 20px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '800',
              fontSize: '16px',
              display: 'inline-block',
              marginRight: '14px'
            }}
          >
            Voir la correction
          </a>
          
            href="/"
            style={{
              background: 'transparent',
              border: '2px solid rgba(255,255,255,0.35)',
              color: '#fff',
              padding: '12px 18px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '16px',
              display: 'inline-block'
            }}
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  )
}
