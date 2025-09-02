import PaymentPanel from '../PaymentPanel'
import { supabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic' // ← empêche la page d'être mise en cache statique

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
  const part = (r: number) => Math.floor(len * r)

  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))

  const justify: React.CSSProperties = { whiteSpace: 'pre-wrap', textAlign: 'justify' }
  const blurBlock: React.CSSProperties = {
    filter: 'blur(6px)',
    pointerEvents: 'none',
    userSelect: 'none',
    position: 'relative',
    zIndex: 1,
  }

  // overlay rose centré (bien par-dessus)
  const overlayWrap: React.CSSProperties = {
    position: 'absolute',
    inset: 0 as any,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 30,
  }
  const pinkBox: React.CSSProperties = {
    background: '#ec4899', // rose visible
    color: '#fff',
    borderRadius: 14,
    padding: '16px 18px',
    boxShadow: '0 10px 30px rgba(236,72,153,.35)',
    maxWidth: 420,
    width: '90%',
    textAlign: 'center',
    pointerEvents: 'auto',
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION</h1>

      {/* Section relative pour l’overlay */}
      <section className="panel" style={{ position: 'relative' }}>
        {/* DÉBUT visible */}
        <h3>Début</h3>
        <p style={justify}>{start}</p>

        {/* Corps flouté (1) */}
        <div style={blurBlock}>
          <p style={justify}>
            {body.slice(part(0.2), part(0.45))}
          </p>
        </div>

        {/* CONTENU visible au milieu — sans le titre */}
        <p style={justify}>{middle}</p>

        {/* Corps flouté (2) */}
        <div style={blurBlock}>
          <p style={justify}>
            {body.slice(part(0.55))}
          </p>
        </div>

        {/* Commentaire global : tout flouté (on n’affiche plus la 1ère ligne “sujet reçu…”) */}
        <h3>Commentaire global</h3>
        <div style={blurBlock}>
          <p style={justify}>{globalComment}</p>
        </div>

        {/* Carré rose centré */}
        <div style={overlayWrap} aria-hidden>
          <div style={pinkBox} aria-label="Débloquer la correction">
            <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: '.3px' }}>
              Débloquer la correction
            </div>
            <div style={{ opacity: 0.95, marginBottom: 10 }}>
              Accédez à l’intégralité de votre copie corrigée.
            </div>
            <PaymentPanel />
          </div>
        </div>

        {/* Marqueur temporaire pour vérifier que la page a bien été mise à jour */}
        <div style={{ marginTop: 16, fontSize: 12, opacity: 0.6 }}>
          — version: <strong>PINK-OVERLAY-v2</strong> —
        </div>
      </section>
    </main>
  )
}
