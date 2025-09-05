// app/page.tsx
import Link from "next/link"

export default function Home() {
  // Styles des pastilles de la nav (compatibles avec ton thème bordeaux)
  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.12)",
    backdropFilter: "blur(8px)",
    background: "rgba(255,255,255,.06)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
  }
  const cta: React.CSSProperties = {
    ...pill,
    background: "linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)",
    boxShadow: "0 12px 30px rgba(123,30,58,.35)",
  }

  return (
    <main>
      {/* ===== NAV (alignée à droite, sans logo/brand) ===== */}
      <header className="nav nav-blur">
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "flex-end", // 👉 aligné à droite
            alignItems: "center",
          }}
        >
          <nav className="nav-links" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="#tarifs" className="nav-link" style={pill}>
              Voir les tarifs
            </Link>
            <Link href="#avis" className="nav-link" style={pill}>
              Avis
            </Link>
            <Link href="/login" className="btn-login" style={cta}>
              Se connecter
            </Link>
          </nav>
        </div>
      </header>

      {/* ===== HERO (gros JURISCORRECT conservé) ===== */}
      <section className="hero">
        <h1
          className="hero-title"
          style={{ display: "inline-flex", alignItems: "center", gap: 12, lineHeight: 1 }}
        >
          {/* Loupe qui suit la couleur du texte (currentColor) */}
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

      {/* ===== PRÉSENTATION (centrée) ===== */}
      <div className="container">
        <section className="presentation card-glass" style={{ marginInline: "auto" }}>
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
          <span className="card-title">COMMENTAIRE D&apos;ARRÊT / FICHE D&apos;ARRÊT</span>
          <span className="card-arrow">→</span>
        </Link>

        <Link href="/cas-pratique" className="card">
          <span className="card-emoji">📝</span>
          <span className="card-title">CAS PRATIQUE</span>
          <span className="card-arrow">→</span>
        </Link>
      </section>

      {/* ===== TARIFS (4 cartes) ===== */}
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

      {/* ===== BIO / AVIS (centré) ===== */}
      <div className="container" id="avis" style={{ scrollMarginTop: 90 }}>
        <footer className="footer card-glass" style={{ marginInline: "auto" }}>
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
