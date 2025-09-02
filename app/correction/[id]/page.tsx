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

  // Sécurise si le texte est très court
  const len = body.length
  const part = (ratio: number) => Math.floor(len * ratio)

  // on montre : début (20%) + un extrait au milieu (10%)
  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))

  // styles simples et centralisés
  const justify: React.CSSProperties = { whiteSpace: 'pre-wrap', textAlign: 'justify' }
  const blurBlock: React.CSSProperties = {
    filter: 'blur(6px)',
    pointerEvents: 'none',
    userSelect: 'none',
  }

  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION</h1>

      <section className="panel">
        {/* DÉBUT visible */}
        <h3>Début</h3>
        <p style={justify}>{start}</p>

        {/* Corps flouté (1ère partie) */}
        <div style={blurBlock}>
          <p style={justify}>
            {body.slice(part(0.2), part(0.45))}
          </p>
        </div>

        {/* Extrait du milieu visible */}
        <h3>Extrait du milieu</h3>
        <p style={justify}>{middle}</p>

        {/* Corps flouté (2ème partie) */}
        <div style={blurBlock}>
          <p style={justify}>
            {body.slice(part(0.55))}
          </p>
        </div>

        {/* Commentaire global : 1ère ligne visible, reste flouté */}
        <h3>Commentaire global</h3>
        <p style={{ textAlign: 'justify' }}>
          {globalComment.split('\n')[0] || ''}
        </p>
        <div style={blurBlock}>
          <p style={justify}>
            {globalComment.split('\n').slice(1).join('\n')}
          </p>
        </div>

        <hr style={{ margin: '16px 0' }} />

        <h3>Exemples de commentaires</h3>
        <ul style={{ textAlign: 'justify' }}>
          <li>✅ Bonne identification du problème juridique dès l’introduction.</li>
          <li>⚠️ Transition à renforcer entre I et II (annonce de plan trop concise).</li>
          <li>❌ Jurisprudence citée sans date : ajoute la référence complète.</li>
        </ul>

        {/* Panneau de paiement (toujours visible, non flouté) */}
        <PaymentPanel />
      </section>
    </main>
  )
}
