import React from 'react'

export default function MerciNouveauPage() {
  return React.createElement('main', {
    className: 'page-wrap'
  }, [
    React.createElement('div', {
      key: 'content',
      style: {
        textAlign: 'center',
        padding: '60px 24px',
        color: '#ffffff',
        maxWidth: '800px',
        margin: '0 auto'
      }
    }, [
      React.createElement('h1', {
        key: 'title',
        style: {
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: '#ffffff'
        }
      }, 'Paiement réussi !'),
      
      React.createElement('p', {
        key: 'description',
        style: {
          fontSize: '1.2rem',
          marginBottom: '40px',
          opacity: 0.9,
          color: '#ffffff'
        }
      }, 'Merci pour votre achat. Votre paiement a bien été traité.'),
      
      React.createElement('div', {
        key: 'info-panel',
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '40px'
        }
      }, [
        React.createElement('h2', {
          key: 'info-title',
          style: {
            color: '#ffffff',
            fontSize: '1.5rem',
            marginBottom: '20px',
            fontWeight: '600'
          }
        }, 'Que se passe-t-il maintenant ?'),
        
        React.createElement('div', {
          key: 'info-list',
          style: {
            textAlign: 'left',
            lineHeight: 1.8,
            fontSize: '1.1rem',
            color: '#ffffff'
          }
        }, [
          React.createElement('p', { key: 'info1', style: { marginBottom: '10px' } }, 'Vous recevrez un email de confirmation sous peu'),
          React.createElement('p', { key: 'info2', style: { marginBottom: '10px' } }, 'Votre correction sera accessible immédiatement'),
          React.createElement('p', { key: 'info3', style: { marginBottom: '0' } }, 'En cas de problème, contactez notre support')
        ])
      ]),
      
      React.createElement('div', {
        key: 'buttons',
        style: {
          marginBottom: '40px'
        }
      }, [
        React.createElement('a', {
          key: 'btn-correction',
          href: '/correction-complete',
          style: {
            backgroundColor: '#ffffff',
            color: '#7b1e3a',
            padding: '16px 32px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '1.1rem',
            marginRight: '15px',
            display: 'inline-block',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }
        }, 'Voir la correction'),
        
        React.createElement('a', {
          key: 'btn-espace',
          href: '/login',
          style: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            padding: '16px 32px',
            borderRadius: '12px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1.1rem',
            display: 'inline-block'
          }
        }, 'Accéder à votre espace client')
      ]),
      
      React.createElement('div', {
        key: 'support',
        style: {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }
      }, [
        React.createElement('h3', {
          key: 'support-title',
          style: {
            margin: '0 0 10px 0',
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#ffffff'
          }
        }, 'Besoin d\'aide ?'),
        
        React.createElement('p', {
          key: 'support-text',
          style: {
            margin: 0,
            color: '#ffffff',
            opacity: 0.9
          }
        }, [
          'Contactez-nous à ',
          React.createElement('a', {
            key: 'email-link',
            href: 'mailto:marie.terki@icloud.com',
            style: {
              color: '#ffffff',
              textDecoration: 'underline'
            }
          }, 'marie.terki@icloud.com')
        ])
      ])
    ])
  ])
}
