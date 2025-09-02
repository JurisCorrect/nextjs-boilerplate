// app/correction/[id]/page.tsx

type Props = { params: { id: string } }

export default function CorrectionPage({ params }: Props) {
  // Pour l’instant on affiche juste l’ID reçu et un message de placeholder
  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION</h1>
      <section className="panel">
        <p><strong>ID de correction :</strong> {params.id}</p>
        <p style={{ marginTop: 12 }}>
          Ta copie a bien été enregistrée. L’affichage détaillé de la correction
          sera branché juste après (connexion Supabase côté page).
        </p>
      </section>
    </main>
  )
}
