// app/cas-pratique/[id]/page.tsx
import { supabase } from '@/app/lib/supabase'
import PaymentPanel from '../../correction/PaymentPanel' // ajuste le chemin si ton PaymentPanel est ailleurs

export const dynamic = 'force-dynamic' // évite le cache statique

type Props = { params: { id: string } }

export default async function CasPratiqueViewPage({ params }: Props) {
  const { data, error } = await supabase
    .from('corrections') // si ta table diffère pour cas pratique, remplace ici
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

  // visible : début (20 %) + paragraphe central (10 %)
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

  // Boîte bordeaux chic centrée (bleu charte #0f2a5f ; bordeaux #7b1e3a)
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
    boxShadow: '0 10px 30px rgba(10,26,61,.25)',
    maxWidth: 380,
    width: '90%',
    textAlign: 'center',
    pointerEvents: 'auto',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION — CAS PRATIQUE</h1>

      {/* position:relative pour l'overlay centré */}
      <section className="panel" style={{ position: 'relative' }}>
        {/* Début visible */}
        <h3>Début</h3>
        <p style={justify}>{start}</p>

        {/* Corps flouté (1) */}
        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.2), part(0.45))}</p>
        </div>

        {/* Paragraphe central visible (sans titre) */}
        <p style={justify}>{middle}</p>

        {/* Corps flouté (2) */}
        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.55))}</p>
        </div>

        {/* Commentaire global : TOUT flouté */}
        <h3>Commentaire global</h3>
        <div style={blurBlock}>
          <p style={justify}>{globalComment}</p>
        </div>

        {/* Carré bordeaux centré */}
        <div style={overlayWrap} aria-hidden>
          <div style={burgundyBox} aria-label="Débloquer la correction">
            <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: '.3px' }}>
              Débloquer la correction
            </div>
            <div style={{ opacity: 0.95, marginBottom: 10 }}>
              Accédez à l’intégralité de votre copie corrigée.
            </div>
            <PaymentPanel />
          </div>
        </div>
      </section>
    </main>
  )
}
