// app/paiement-annule/page.tsx
export default function PaiementAnnule() {
  return (
    <main className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
      <div className="card-glass" style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Paiement annulé</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          Votre paiement n’a pas abouti. Vous pouvez réessayer quand vous voulez.
        </p>
        <div style={{ marginTop: 20 }}>
          <a href="/tarifs" className="btn-login" style={{
            display:'inline-flex', alignItems:'center', gap:8, padding:'10px 16px',
            borderRadius:14, background:'linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)',
            color:'#fff', fontWeight:800, textDecoration:'none', boxShadow:'0 12px 30px rgba(123,30,58,.35)'
          }}>
            Revenir aux tarifs →
          </a>
        </div>
      </div>
    </main>
  )
}
