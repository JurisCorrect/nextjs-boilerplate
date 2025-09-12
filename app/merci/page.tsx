"use client"
import { useState } from "react"

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
            <div style={{ textAlign: 'left', lineHeight: 1.8, fontSize: 16 }}>
              <div>• Un email de confirmation vous a été envoyé.</div>
              <div>• Votre correction est maintenant accessible.</div>
              <div>• Support : marie.terki@icloud.com</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            
              href="/correction-complete"
              style={{
                background: '#fff',
                color: '#7b1e3a',
                padding: '14px 20px',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 16,
                display: 'inline-block'
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
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 16,
                display: 'inline-block'
              }}
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
