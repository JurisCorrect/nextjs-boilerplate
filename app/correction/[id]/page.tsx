import PaymentPanel from '../PaymentPanel'
import { supabase } from '@/app/lib/supabase'

type Props = { params: { id: string } }

export default async function CorrectionPage({ params }: Props) {
  const { data, error } = await supabase
    .from('corrections')
    .select('result_json')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return (
      <main className="page-wrap">
        <p style={{ textAlign: 'justify' }}>❌ Erreur : correction introuvable.</p>
      </main>
    )
  }

  const result = data.result_json as any
  const body: string = result.normalizedBody || ''
  const globalComment: string = result.globalComment || ''

  const len = body.length
  const part = (ratio: number) => Math.floor(len * ratio)

  // on montre : début (20%) + un extrait (10%) au milieu (sans le titre) ; le reste est flouté
  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))

  const justify: React.CSSProperties = { whiteSpace: 'pre-wrap', textAlign: 'justify' }
  const blurBlock: React.CSSProperties = {
    filter: 'blur(6px)',
    pointerEvents: 'none',
    userSelect: 'none',
  }

  // styles du carré rose (overlay centré)
  const overlayWrap: React.CSSProperties = {
    position: 'absolute',
    inset: 0 as any,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none', // laisse passer les clics ailleurs
  }
  const pinkBox: React.CSSProperties = {
    background: '#ec4899', // beau rose
    color: '#fff',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 10px 30px rgba(236,72,153,.35)',
    maxWidth: 420,
    width: '90%',
    textAlign: 'center',
    pointerEvents: 'auto', // clics autorisés dans la box
  }
  const pinkTitle: React.CSSProperties = {
    margin: '0 0 8px',
    fontWeight: 900,
    letterSpacing: '.3px',
  }
  const pinkText: React.CSSProperties = {
    margin: '0 0 10px',
    opacity: 0.95,
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION</h1>

      {/* On rend la section relative pour placer l’overlay centré */}
      <section className="panel" style={{ position: 'relative' }}>
        {/* Début visible */}
        <h3>Début</h3>
        <p style={justify}>{start}</p>

        {/* Corps flouté (1ère partie) */}
        <div style={blurBlock}>
          <p style={justify}>
            {body.slice(part(0.2), part(0.45))}
          </p>
        </div>

        {/* Extrait du milieu : on laisse le contenu, mais on SUPPRIME le titre */}
        <p style={justify}>{middle}</p>

        {/* Corps flouté (2ème partie) */}
        <div style={blurBlock}>
          <p style={justify}>
            {body.slice(part(0.55))}
          </p>
        </div>

        {/* Commentaire global : on supprime la ligne visible (“sujet reçu…”) et on floute TOUT */}
        <h3>Commentaire global</h3>
        <div style={blurBlock}>
          <p style={justify}>
            {globalComment}
          </p>
        </div>

        {/* Carré rose “Débloquer la correction” centré, posé PAR-DESSUS une zone floutée */}
        <div style={overlayWrap} aria-hidden>
          <div style={pinkBox} aria-label="Débloquer la correction">
            <h4 style={pinkTitle}>Débloquer la correction</h4>
            <p style={pinkText}>Accédez à l’intégralité de votre copie corrigée.</p>
            {/* Tu peux garder ton composant paiement ici */}
            <PaymentPanel />
          </div>
        </div>
      </section>
    </main>
  )
}
