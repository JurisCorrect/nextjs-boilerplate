// app/correction/[id]/page.tsx
export default function CorrectionPage({ params }: { params: { id: string } }) {
  return (
    <main className="page-wrap">
      <h1 className="page-title">CORRECTION</h1>
      <section className="panel">
        <p><strong>ID :</strong> {params.id}</p>
        <p>Page trouvée ✅</p>
      </section>
    </main>
  );
}
