import PaymentPanel from '../PaymentPanel'
// app/correction/[id]/page.tsx
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

  // on ne montre que des morceaux (début + milieu), le reste flouté
  const start = body.slice(0, Math.floor(body.length * 0.2))
  const middle = body.slice(Math.floor(body.length * 0.45), Math.floor(body.length * 0.55))

  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION</h1>
      <section className="panel">
        <h3>Début</h3>
        <p style={{ whiteSpace:'pre-wrap', textAlign:'justify' }}>{start}</p>

        <div style={{ filter:'blur(6px)' }}>
          <p style={{ whiteSpace:'pre-wrap', textAlign:'justify' }}>
            {body.slice(Math.floor(body.length*0.2), Math.floor(body.length*0.45))}
          </p>
        </div>

        <h3>Extrait du milieu</h3>
        <p style={{ whiteSpace:'pre-wrap', textAlign:'justify' }}>{middle}</p>

        <div style={{ filter:'blur(6px)' }}>
          <p style={{ whiteSpace:'pre-wrap', textAlign:'justify' }}>
            {body.slice(Math.floor(body.length*0.55))}
          </p>
        </div>

        <h3>Commentaire global</h3>
        <p style={{ textAlign:'justify' }}>{globalComment.split('\n')[0]}</p>
        <div style={{ filter:'blur(6px)' }}>
          <p style={{ whiteSpace:'pre-wrap', textAlign:'justify' }}>
            {globalComment.split('\n').slice(1).join('\n')}
          </p>
        </div>
        <hr style={{ margin:'16px 0' }} />
<h3>Exemples de commentaires</h3>
<ul>
  <li>✅ Bonne identification du problème juridique dès l’introduction.</li>
  <li>⚠️ Transition à renforcer entre I et II (annonce de plan trop concise).</li>
  <li>❌ Jurisprudence citée sans date : ajoutez la référence complète.</li>
</ul>

<PaymentPanel />
      </section>
    </main>
  )
}
