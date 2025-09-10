// app/merci/page.tsx
"use client"
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function MerciContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  return (
    <main className="page-wrap">
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '20px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Paiement réussi !
        </h1>
        
        <p style={{
          fontSize: '1.3rem',
          color: '#ffffff',
          marginBottom: '40px',
          lineHeight: 1.6,
          opacity: 0.9
        }}>
          Merci pour votre achat. Votre paiement a été traité avec succès.
        </p>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '40px'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '1.3rem',
            marginBottom: '20px',
            fontWeight: '600'
          }}>
            Que se passe-t-il maintenant ?
          </h3>
          <ul style={{
            textAlign: 'left',
            color: '#ffffff',
            lineHeight: 1.8,
            fontSize: '1.1rem',
            listStyle: 'none',
            padding: 0
          }}>
            <li style={{ marginBottom: '8px' }}>Vous recevrez un email de confirmation sous peu</li>
            <li style={{ marginBottom: '8px' }}>Votre correction sera accessible immédiatement</li>
            <li>En cas de problème, contactez notre support</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '40px'
        }}>
          <a 
            href={sessionId ? `/correction-complete?session_id=${sessionId}` : '/corrections'}
            style={{
              backgroundColor: '#ffffff',
              color: '#7b1e3a',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
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
              fontWeight: '600',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
            onMouseOver={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'
            }}
            onMouseOut={(e) => {
              const target = e.target as HTMLElement
              target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
            }}
          >
            Retour à l'accueil
          </a>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          fontSize: '1rem',
          color: '#ffffff'
        }}>
          <strong style={{ fontSize: '1.1rem' }}>Besoin d'aide ?</strong><br />
          <span style={{ opacity: 0.9 }}>Contactez-nous à </span>
          <a 
            href="mailto:marie.terki@icloud.com"
            style={{
              color: '#ffffff',
              textDecoration: 'underline',
              fontWeight: '600'
            }}
          >
            marie.terki@icloud.com
          </a>
        </div>
      </div>
    </main>
  )
}

export default function MerciPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        textAlign: 'center', 
        padding: '60px',
        color: '#ffffff'
      }}>
        Chargement...
      </div>
    }>
      <MerciContent />
    </Suspense>
  )
}
