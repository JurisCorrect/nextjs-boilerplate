import Link from 'next/link'

export default function Home() {
  return (
    <main className="container">
      <header className="header">
        <h1 style={{color:'var(--brand-blue)', marginBottom: 4}}>Jurisconnect</h1>
        <p className="intro">
          Jurisconnect est un outil de correction automatisée fondé sur la base de données d’un professeur particulier.
          Contrairement aux IA génératives, non conçues pour corriger un devoir juridique ni respecter sa méthodologie très particulière,
          Jurisconnect ne fait jamais le devoir à la place de l’étudiant : il corrige, explique et guide point par point pour aider à intégrer la méthodologie.
        </p>
      </header>

      <section className="grid">
        <Link href="/dissertation" className="card">
          <div className="title">📚 dissertation juridique</div>
        </Link>

        <Link href="/commentaire" className="card">
          <div className="title">⚖️ commentaire d'arrêt / fiche d'arrêt</div>
        </Link>

        <Link href="/cas-pratique" className="card">
          <div className="title">📝 cas pratique</div>
        </Link>
      </section>

      <footer className="footer">
        <img src="/marie.jpg" alt="Marie" className="avatar" />
        <p>
          je m’appelle Marie, doctorante en droit et professeure particulière. j’ai conçu Jurisconnect
          pour offrir une correction fiable, structurée et vraiment formatrice, fidèle aux attentes universitaires.
        </p>
        <a className="link" href="https://ton-lien-AVI.com" target="_blank" rel="noreferrer">découvrir AVI</a>
      </footer>
    </main>
  )
}
