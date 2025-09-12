import React from 'react'

export default function MerciPage() {
  return React.createElement('div', {
    style: {
      minHeight: '100vh',
      background: '#7b1e3a',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px'
    }
  }, [
    React.createElement('div', {
      key: 'container',
      style: { maxWidth: '720px', width: '100%' }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: { fontSize: '36px', fontWeight: '800', marginBottom: '12px' }
      }, 'Paiement réussi !'),
      
      React.createElement('p', {
        key: 'desc',
        style: { fontSize: '18px', lineHeight: '1.6', opacity: '0.95', marginBottom: '28px' }
      }, 'Merci pour votre achat. Votre paiement a bien été traité.'),
      
      React.createElement('div', {
        key: 'info-box',
        style: {
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.20)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          textAlign: 'left'
        }
      }, [
        React.createElement('h3', {
          key: 'info-title',
          style: { margin: '0', fontSize: '20px', fontWeight: '700', marginBottom: '12px', textAlign: 'center' }
        }, 'Et maintenant ?'),
        React.createElement('div', { key: 'info-text' }, '• Un email de confirmation vous a été envoyé.'),
        React.createElement('div', { key: 'info-text2' }, '• Votre correction est maintenant accessible.'),
        React.createElement('div', { key: 'info-text3' }, '• Support : marie.terki@icloud.com')
      ]),
      
      React.createElement('div', { key: 'buttons' }, [
        React.createElement('a', {
          key: 'btn1',
          href: '/correction-complete',
          style: {
            background: '#fff',
            color: '#7b1e3a',
            padding: '14px 20px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '800',
            fontSize: '16px',
            display: 'inline-block',
            marginRight: '14px'
          }
        }, 'Voir la correction'),
        
        React.createElement('a', {
          key: 'btn2',
          href: '/',
          style: {
            background: 'transparent',
            border: '2px solid rgba(255,255,255,0.35)',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '16px',
            display: 'inline-block'
          }
        }, 'Retour à l\'accueil')
      ])
    ])
  ])
}
