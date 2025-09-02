// app/correction/[id]/page.tsx
import PaymentPanel from '../PaymentPanel'
import { supabase } from '@/app/lib/supabase'

export const dynamic = 'force-dynamic' // pas de cache statique

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

  // visible : début (20%) + un paragraphe central (10%) — sans afficher "Extrait du milieu"
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

  // Carré bordeaux classe (surimpression centrée)
  // Bleu de ta charte: #0f2a5f ; Bordeaux choisi: #7b1e3a
  const overlayWrap: React.CSSProperties = {
    position: 'absolute',
    inset: 0 as any,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 30,
  }
  const burgundyBox: React.CSSProperties = {
    background: '#7b1e3a',
    color: '#fff',
    borderRadius: 12,
    padding: '16px 18px',
    boxShadow: '0 10px 30px rgba(10,26,61,.25)', // ombre bleutée élégante
    maxWidth: 380,
    width: '90%',
    textAlign: 'center',
    pointerEvents: 'auto',
    border: '1px solid rgba(255,255,255,0.08)',
  }
  const burgundyTitle: React.CSSProperties = {
    margin: '0 0 8px',
    fontWeight: 900,
    letterSpacing: '.3px',
  }
  const burgundyText: React.CSSProperties = {
    margin: '0 0 10px',
    opacity: 0.95,
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION</h1>

      {/* section relative pour placer l’overlay au centre */}
      <section className="panel" style={{ position: 'relative' }}>
        {/* Début visible */}
        <h3>Début</h3>
        <p style={justify}>{start}</p>

        {/* Corps flouté (1) */}
        <div style={blurBlock}>
          <p style={justify}>
            {body.slice(part(0.2), part(0.45))}
          </p>
        </div>

        {/* Paragraphe central visible (sans le titre) */}
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

        {/* Carré bordeaux “Débloquer la correction” centré */}
        <div style={overlayWrap} aria-hidden>
          <div style={burgundyBox} aria-label="Débloquer la correction">
            <div style={burgundyTitle}>Débloquer la correction</div>
            <div style={burgundyText}>Accédez à l’intégralité de votre copie corrigée.</div>
            <PaymentPanel />
          </div>
        </div>
      </section>
    </main>
  )
}
