// app/page.tsx
import Link from "next/link"

export default function Home() {
  // Petits styles "pill" inline pour ne pas dépendre d'un patch CSS
  const pillBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.18)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
    boxShadow: "0 12px 30px rgba(123,30,58,.25)",
    transition: "transform .18s ease, opacity .18s ease",
  }
  const pillPrimary: React.CSSProperties = {
    ...pillBase,
    background: "linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)",
    border: "1px solid rgba(255,255,255,.22)",
  }

  return (
    <main>
      {/* ===== NAV ===== */}
      <header className="nav nav-blur">
        <div className="container nav-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="brand" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <svg
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 22, height: 22, verticalAlign: "-2px" }} aria-hidden="true"
            >
              <path d="M12 3v2" /><path d="M3 7h18" /><path d="M6 7l-3 6a4 4 0 0 0 8 0L8 7" /><path d="M18 7l-3 6a4 4 0 0 0 8 0l-3-6" /><path d="M12 5v13" />
            </svg>
            JURISCORRECT
          </div>

          <nav className="nav-links" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="#tarifs" style={pillBase}>Voir les tarifs</Link>
            <Link href="#avis" style={pillBase}>Avis</Link>
            <Link href="/login" style={pillPrimary}>Se connecter</Link>
          </nav>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero">
        <h1 className="hero-title" style={{ display: "inline-flex", alignItems: "center", gap: 12, lineHeight: 1 }}>
          <svg
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ width: "1em", height: "1em", display: "inline-block" }} aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15 15l5 5" />
          </svg>
          JURISCORRECT
        </h1>
      </section>

      {/* ===== PRÉSENTATION (centrée dur) ===== */}
      <div className="container" style={{ display: "flex", justifyContent: "center" }}>
        <section
          className="presentation card-glass"
          style={{ width: "min(900px, 100%)", marginLeft: "auto", marginRight: "auto" }}
        >
          <p>
            JURISCORRECT est un outil de correction automatisée fondé sur la base de données d’un professeur particulier.
            Contrairement aux IA génératives, qui ne sont pas conçues pour corriger les devoirs juridiques et qui ignorent
            la méthodologie extrêmement particulière de cette discipline, JURISCORRECT ne fait jamais le devoir à la place
            de l’étudiant : il corrige, explique et guide. Grâce à une méthodologie rigoureuse et des critères pédagogiques
            précis, l’étudiant reçoit une correction fiable et personnalisée qui lui permet d’intégrer et de maîtriser
            progressivement la méthodologie juridique.
          </p>
        </section>
      </div>

      {/* ===== CARTES EXERCICES ===== */}
      <section className="grid">
        <Link href="/dissertation" className="card">
          <span className="card-emoji">📚</span>
          <span className="card-title">DISSERTATION JURIDIQUE</span>
          <span className="card-arrow">→</span>
        </Link>

        <Link href="/commentaire" className="card">
          <span className="card-emoji">⚖️</span>
          <span className="card-title">COMMENTAIRE D'ARRÊT / FICHE D'ARRÊT</span>
          <span className="card-arrow">→</span>
        </Link>

        <Link href="/cas-pratique" className="card">
          <span className="card-emoji">📝</span>
          <span className="card-title">CAS PRATIQUE</span>
          <span className="card-arrow">→</span>
        </Link>
      </section>

      {/* ===== TARIFS ===== */}
      <section id="tarifs" className="container" style={{ margin: "28px auto 8px" }}>
        <h2 className="section-title">Tarifs</h2>
        <div className="pricing-grid">
          <div className="pricing-card card-glass">
            <div className="pricing-title">Correction unique</div>
            <div className="pricing-price">3 €</div>
          </div>
          <div className="pricing-card card-glass">
            <div className="pricing-title">Pack 5 corrections</div>
            <div className="pricing-price">5 €</div>
          </div>
          <div className="pricing-card card-glass">
            <div className="pricing-title">Pack 10 corrections</div>
            <div className="pricing-price">8 €</div>
          </div>
          <div className="pricing-card card-glass">
            <div className="pricing-title">Illimité mensuel</div>
            <div className="pricing-price">13 €/mois</div>
          </div>
        </div>
      </section>

      {/* ===== BIO / AVIS (centré dur) ===== */}
      <div className="container" id="avis" style={{ scrollMarginTop: 90, display: "flex", justifyContent: "center" }}>
        <footer
          className="footer card-glass"
          style={{ width: "min(980px, 100%)", marginLeft: "auto", marginRight: "auto" }}
        >
          <img src="/marie.jpg" alt="Marie" className="avatar" />
          <p>
            Doctorante en droit international pénal et professeur particulier depuis quatre ans, j’ai effectué un parcours
            universitaire rigoureux, validé mention bien à chaque étape. Après une licence à l’université de Créteil,
            j’ai obtenu deux masters : un master 1 et 2 de droit international et droit comparé à Nanterre, puis un master 1
            et 2 de droit pénal et sciences criminelles à Toulouse. Au fil de mes années d’enseignement, j’ai constaté que le
            plus grand défi des étudiants en droit était la maîtrise de la méthodologie. C’est pourquoi j’ai créé JURISCORRECT :
            pour démocratiser l’accès à une correction de qualité et permettre à chaque étudiant de progresser efficacement.
            Il s’agit de ma correction basée sur mes critères et non pas ceux d’Internet. Avec quatre ans d’expérience et un
            taux de réussite de 100 % parmi mes élèves, je mets aujourd’hui mon expertise à votre service à travers cet outil.
            Pour un accompagnement personnalisé ou des cours particuliers, contactez-moi :
            <a href="mailto:marie.terki@icloud.com"><strong><u> marie.terki@icloud.com</u></strong></a>.
          </p>
        </footer>
      </div>
    </main>
  )
}
