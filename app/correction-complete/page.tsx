// app/correction-complete/page.tsx
"use client"
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function CorrectionCompleteContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [correction, setCorrection] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCorrection() {
      if (!sessionId) {
        setError('ID de session manquant')
        setLoading(false)
        return
      }

      try {
        // Simulation d'une correction - vous remplacerez par votre vraie logique
        // En réalité, vous devrez récupérer la correction depuis Supabase
        // en utilisant le session_id pour identifier quelle correction débloquer
        
        setTimeout(() => {
          setCorrection({
            title: 'Dissertation de Droit Civil',
            normalizedBody: `Introduction

Le droit civil français constitue la branche fondamentale du droit privé qui régit les rapports entre les particuliers. Cette matière, codifiée principalement dans le Code civil depuis 1804, établit les règles essentielles concernant les personnes, les biens et les obligations.

I. Les personnes en droit civil

A. La personnalité juridique
La personnalité juridique s'acquiert par la naissance et se perd par la mort. Elle confère à tout individu la capacité d'être titulaire de droits et d'obligations. Cette notion fondamentale permet de distinguer les personnes physiques des personnes morales.

B. La capacité juridique
La capacité juridique se divise en deux aspects : la capacité de jouissance (aptitude à être titulaire de droits) et la capacité d'exercice (aptitude à exercer ses droits). Certaines personnes peuvent voir leur capacité limitée (mineurs, majeurs protégés).

II. Les biens et la propriété

A. Classification des biens
Le droit civil distingue plusieurs catégories de biens : meubles et immeubles, biens corporels et incorporels, biens dans le commerce et hors commerce. Cette classification emporte des conséquences juridiques importantes notamment en matière de publicité et de garanties.

B. Le droit de propriété
Défini à l'article 544 du Code civil, le droit de propriété confère à son titulaire les prérogatives d'usus, fructus et abusus. Ce droit, qualifié d'absolu, exclusif et perpétuel, constitue le pilier du système patrimonial français.

III. Le régime des obligations

A. Les sources des obligations
Les obligations naissent principalement du contrat, du fait juridique (responsabilité civile) ou de la loi. Chaque source obéit à des règles spécifiques de formation et d'exécution.

B. L'exécution et l'inexécution
L'exécution des obligations peut être volontaire ou forcée. En cas d'inexécution, le créancier dispose de plusieurs remèdes : exécution forcée, résolution, dommages-intérêts.

Conclusion

Le droit civil, par sa richesse et sa complexité, demeure au cœur du système juridique français. Son évolution constante, notamment sous l'influence du droit européen et de la jurisprudence, témoigne de sa capacité d'adaptation aux enjeux contemporains tout en préservant ses fondements historiques.`,
            globalComment: `Appréciation générale : 16/20

Points positifs :
- Structure claire et logique de la dissertation
- Maîtrise des concepts fondamentaux du droit civil  
- Références appropriées aux textes légaux (art. 544 Code civil)
- Style juridique adapté et vocabulaire précis
- Développement équilibré des différentes parties

Points à améliorer :
- Manque de références jurisprudentielles pour enrichir l'analyse
- Introduction pourrait être plus problématisée
- Conclusion mériterait d'être plus prospective
- Certains développements pourraient être approfondis (régime des incapacités)

Conseils pour progresser :
- Intégrer davantage d'arrêts de principe dans l'argumentation
- Développer l'analyse critique des solutions existantes
- Soigner davantage les transitions entre les parties
- Enrichir la bibliographie avec des références doctrinales récentes`
          })
          setLoading(false)
        }, 1500) // Simulation du temps de chargement

      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement')
        setLoading(false)
      }
    }

    fetchCorrection()
  }, [sessionId])

  if (loading) {
    return (
      <main className="page-wrap">
        <div style={{ textAlign: 'center', padding: '60px', color: '#ffffff' }}>
          <div style={{ fontSize: '2rem', marginBottom: '20px' }}>📚</div>
          <h2>Chargement de votre correction...</h2>
          <p style={{ opacity: 0.8 }}>Veuillez patienter quelques instants</p>
        </div>
      </main>
    )
  }

  if (error || !correction) {
    return (
      <main className="page-wrap">
        <div style={{ textAlign: 'center', padding: '60px', color: '#ffffff' }}>
          <h2>Erreur</h2>
          <p>{error || 'Correction introuvable'}</p>
          <a 
            href="/"
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
            Retour à l'accueil
          </a>
        </div>
      </main>
    )
  }

  const justify: React.CSSProperties = { 
    whiteSpace: 'pre-wrap', 
    textAlign: 'justify',
    color: '#ffffff',
    lineHeight: 1.8,
    fontSize: '1.1rem'
  }

  return (
    <main className="page-wrap">
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            color: '#ffffff', 
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            {correction.title}
          </h1>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '12px 24px',
            borderRadius: '25px',
            display: 'inline-block',
            color: '#ffffff',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            ✓ Correction complète débloquée
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            color: '#ffffff', 
            fontSize: '1.5rem',
            marginBottom: '20px',
            fontWeight: '600'
          }}>
            Votre dissertation corrigée
          </h2>
          <div style={justify}>
            {correction.normalizedBody}
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '40px'
        }}>
          <h2 style={{ 
            color: '#ffffff', 
            fontSize: '1.5rem',
            marginBottom: '20px',
            fontWeight: '600'
          }}>
            Commentaire et conseils personnalisés
          </h2>
          <div style={justify}>
            {correction.globalComment}
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <a 
            href="/"
            style={{
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
            }}
          >
            Nouvelle correction
          </a>
          
          <button
            onClick={() => window.print()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: '12px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              fontWeight: '600',
              fontSize: '1.1rem',
              cursor: 'pointer'
            }}
          >
            Imprimer / Sauvegarder PDF
          </button>
        </div>

      </div>
    </main>
  )
}

export default function CorrectionCompletePage() {
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
      <CorrectionCompleteContent />
    </Suspense>
  )
}
