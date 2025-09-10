// app/merci/page.tsx
import { Suspense } from 'react'

function MerciContent() {
  return (
    <main className="page-wrap">
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '20px'
        }}>
          ✅
        </div>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#059669',
          marginBottom: '16px'
        }}>
          Paiement réussi !
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#6b7280',
          marginBottom: '30px',
          lineHeight: 1.6
        }}>
          Merci pour votre achat. Votre paiement a été traité avec succès.
        </p>

        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h3 style={{
            color: '#059669',
            fontSize: '1.1rem',
            marginBottom: '10px'
          }}>
            Que se passe-t-il maintenant ?
          </h3>
          <ul style={{
            textAlign: 'left',
            color: '#374151',
            lineHeight: 1.6
          }}>
            <li>• Vous recevrez un email de confirmation sous peu</li>
            <li>• Votre correction sera accessible immédiatement</li>
            <li>• En cas de problème, contactez notre support</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <a 
            href="/"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
          >
            Retour à l'accueil
          </a>
          
          <a 
            href="/corrections"
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
          >
            Voir mes corrections
          </a>
        </div>

        <div style={{
          marginTop: '40px',
          padding: '15px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <strong>Besoin d'aide ?</strong><br />
          Contactez-nous à support@juriscorrect.fr
        </div>
      </div>
    </main>
  )
}

export default function MerciPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '60px' }}>
        Chargement...
      </div>
    }>
      <MerciContent />
    </Suspense>
  )
}
