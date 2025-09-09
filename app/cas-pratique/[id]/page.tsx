// app/cas-pratique/[id]/page.tsx
import { supabase } from '@/app/lib/supabase'
import PaymentPanel from '../../correction/PaymentPanel' // ajuste le chemin si besoin

export const dynamic = 'force-dynamic'

type Props = { params: { id: string } }

export default async function CasPratiqueViewPage({ params }: Props) {
  const theId = params.id; // ← on récupère l'ID d'URL pour le passer au PaymentPanel

  const { data, error } = await supabase
    .from('corrections')
    .select('result_json')
    .eq('id', theId)
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

      <section className="panel" style={{ position: 'relative' }}>
        <h3>Début</h3>
        <p style={justify}>{start}</p>

        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.2), part(0.45))}</p>
        </div>

        <p style={justify}>{middle}</p>

        <div style={blurBlock}>
          <p style={justify}>{body.slice(part(0.55))}</p>
        </div>

        <h3>Commentaire global</h3>
        <div style={blurBlock}>
          <p style={justify}>{globalComment}</p>
        </div>

        <div style={overlayWrap} aria-hidden>
          <div style={burgundyBox} aria-label="Débloquer la correction">
            <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: '.3px' }}>
              Débloquer la correction
            </div>
            <div style={{ opacity: 0.95, marginBottom: 10 }}>
              Accédez à l’intégralité de votre copie corrigée.
            </div>
            {/* ⬇️ Prop refId ajoutée */}
            <PaymentPanel refId={theId} />
          </div>
        </div>
      </section>
    </main>
  )
}
