import Link from "next/link"

export default function Home() {
  return (
    <main>
      {/* --- NAV BAR collante --- */}
      <header className="nav nav-blur">
        <div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div className="brand" aria-label="JURISCORRECT">
            <span style={{fontSize:20,marginRight:8}}>⚖️</span> JURISCORRECT
          </div>
          <nav className="nav-links">
            <Link href="#pricing" className="nav-link">Voir les tarifs</Link>
            <Link href="#reviews" className="nav-link">Avis</Link>
            <Link href="/login" className="btn btn-small">Se connecter</Link>
          </nav>
        </div>
      </header>

      {/* --- HERO --- */}
      <section className="hero">
        <h1
          className="hero-title"
          style={{ display:'inline-flex', alignItems:'center', gap:12, lineHeight:1 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round"
               style={{ width:'1em', height:'1em' }} aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15 15l5 5" />
          </svg>
          JURISCORRECT
        </h1>
      </section>

      {/* --- TA PRÉSENTATION (inchangée dans le fond) mais look “glass” bordeaux --- */}
      <section className="presentation intro-card card-glass">
        <p>
          JURISCORRECT est un outil de correction automatisée fondé sur la base de données d’un professeur particulier. 
          Contrairement aux IA génératives, qui ne sont pas conçues pour corriger les devoirs juridiques et qui ignorent la méthodologie extrêmement particulière de cette discipline, 
          JURISCORRECT ne fait jamais le devoir à la place de l’étudiant : il corrige, explique et guide. Grâce à une méthodologie rigoureuse et des critères pédagogiques précis, 
          l’étudiant reçoit une correction fiable et personnalisée qui lui permet d’intégrer et de maîtriser progressivement la méthodologie juridique.
        </p>
      </section>

      {/* --- LES 3 CARTES --- */}
      <section className="grid">
        <Link href="/dissertation" className="card">
          <span className="card-emoji">📚</span>
          <span className="card-title">DISSERTATION JURIDIQUE</span>
          <span className="card-arrow">➜</span>
        </Link>

        <Link href="/commentaire" className="card">
          <span className="card-emoji">⚖️</span>
          <span className="card-title">COMMENTAIRE D'ARRÊT / FICHE D'ARRÊT</span>
          <span className="card-arrow">➜</span>
        </Link>

        <Link href="/cas-pratique" className="card">
          <span className="card-emoji">📝</span>
          <span className="card-title">CAS PRATIQUE</span>
          <span className="card-arrow">➜</span>
        </Link>
      </section>

      {/* --- ANCRAGES pour la nav (tu rempliras plus tard si tu veux) --- */}
      <section id="pricing" className="container" style={{paddingTop:12, paddingBottom:12}} />
      <section id="reviews" className="container" style={{paddingTop:12, paddingBottom:12}} />

      {/* --- BIO / FOOTER en Bordeaux --- */}
      <footer className="footer card-glass footer-bordeaux">
        <img src="/marie.jpg" alt="Marie" className="avatar" />
        <p>
          Doctorante en droit international pénal et professeur particulier depuis quatre ans, j’ai effectué un parcours universitaire rigoureux, 
          validé mention bien à chaque étape. Après une licence à l’université de Créteil, j’ai obtenu deux masters : un master 1 et 2 de droit international et droit comparé à Nanterre, 
          puis un master 1 et 2 de droit pénal et sciences criminelles à Toulouse. 
          Au fil de mes années d’enseignement, j’ai constaté que le plus grand défi des étudiants en droit était la maîtrise de la méthodologie. 
          C’est pourquoi j’ai créé JURISCORRECT : pour démocratiser l’accès à une correction de qualité et permettre à chaque étudiant de progresser efficacement. 
          Il s’agit de ma correction basée sur mes critères et non pas ceux d’Internet. 
          Avec quatre ans d’expérience et un taux de réussite de 100 % parmi mes élèves, je mets aujourd’hui mon expertise à votre service à travers cet outil. 
          Pour un accompagnement personnalisé ou des cours particuliers, contactez-moi :{" "}
          <a href="mailto:marie.terki@icloud.com"><strong><u>marie.terki@icloud.com</u></strong></a>.
        </p>
      </footer>
    </main>
  )
}
