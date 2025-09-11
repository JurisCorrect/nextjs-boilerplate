export default function MerciPage() {
  return (
    <main className="page-wrap">
      <div style={{ textAlign: 'center', padding: '60px', color: '#ffffff' }}>
        <h1>Paiement réussi !</h1>
        <p>Merci pour votre achat. Votre paiement a bien été traité.</p>
        <a 
          href="/correction-complete"
          style={{
            backgroundColor: '#ffffff',
            color: '#7b1e3a',
            padding: '12px 24px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            marginTop: '20px',
            display: 'inline-block'
          }}
        >
          Voir la correction
        </a>
      </div>
    </main>
  )
}
