// app/correction/[id]/page.tsx
import TeaserClient from "../TeaserClient"

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionPage({ params }: Props) {
  const id = params.id
  return (
    <main className="page-wrap correction">
      <h1 className="page-title">CORRECTION</h1>
      <TeaserClient submissionId={id} />
    </main>
  )
}
