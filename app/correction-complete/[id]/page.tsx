// app/correction/[id]/page.tsx
import AnnotatedTeaser from "../AnnotatedTeaser"

export const dynamic = "force-dynamic"

export default function CorrectionPage({ params }: { params: { id: string } }) {
  return (
    <main className="page-wrap correction">
      <h1 className="page-title">CORRECTION</h1>
      <AnnotatedTeaser submissionId={params.id} />
    </main>
  )
}
