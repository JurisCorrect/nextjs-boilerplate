// app/page.tsx
import Link from "next/link"

export default function Home() {
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
    background: "linear-gradient(180deg, #7b1e3a 0%, #962746 100%)",
    boxShadow: "0 12px 30px rgba(123,30,58,.35)",
  }

  return (
    <main>
      {/* ===== NAV ===== */}
      <header className="nav nav-blur">
        <div className="container" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <nav className="nav-links" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/tarifs" className="nav-link" style={pill}>Tarifs</Link>
            <Link href="/login" className="btn-login" style={cta}>Se connecter</Link>
          </nav>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero">{/* Titre via CSS */}</section>

      {/* ===== PRÉSENTATION ===== */}
      <div className="container">
        <section className="presentation card-glass" style={{ marginInline: "auto" }}>
          <p>
            JURISCORRECT est un outil de correction automatisée fondé sur la base de données d'un professeur particulier…
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

      {/* ===== AVIS / BIO ===== */}
      <section className="container" id="avis" style={{ scrollMarginTop: 90 }}>
        <div className="card-glass" style={{ maxWidth: 980, margin: "16px auto 36px", padding: "clamp(16px, 2.4vw, 24px)" }}>
          <div style={{ display: "flex", flexDirection: "row", gap: 20, alignItems: "flex-start" }}>
            {/* Texte à gauche */}
            <div style={{ flex: "1 1 auto" }}>
              <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0, textAlign: "justify" }}>
                <span className="badge-accent">Qui suis-je ?</span>
                Doctorante en droit international pénal et professeur particulier depuis quatre ans, j'ai effectué…
              </p>
            </div>
            {/* Photo à droite */}
            <div style={{ flex: "0 0 180px", display: "flex", justifyContent: "center" }}>
              <img
                src="/marie.jpg"
                alt="Marie"
                style={{
                  width: 180, height: 180, borderRadius: "50%", objectFit: "cover",
                  border: "2px solid rgba(255,255,255,.7)", boxShadow: "0 8px 24px rgba(0,0,0,.35)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== POUR ALLER PLUS LOIN ===== */}
      <section className="container" style={{ marginBottom: 40 }}>
        <div className="card-glass" style={{ maxWidth: 980, margin: "0 auto", padding: "clamp(16px, 2.4vw, 24px)" }}>
          <h3 style={{ color: "#fff", fontSize: "1.2rem", fontWeight: 800, marginBottom: 16, marginTop: 0 }}>
            <span className="badge-accent">Pour aller plus loin...</span>
          </h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0, textAlign: "justify" }}>
            Au-delà de l'outil JURISCORRECT, je propose également un accompagnement personnalisé…
            <br /><br />
            Pour toute demande :{" "}
            <a href="mailto:marie.terki@icloud.com" style={{ color: "#7b1e3a", textDecoration: "none", fontWeight: 700 }}>
              <strong>marie.terki@icloud.com</strong>
            </a>
          </p>
        </div>
      </section>

      {/* ---------- Override global pour forcer la pastille bordeaux ---------- */}
      <style jsx global>{`
        .badge-accent {
          display: inline-block;
          vertical-align: baseline;
          margin-right: 10px;
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 0.95rem;
          letter-spacing: .2px;
          white-space: nowrap;
          color: #fff !important;
          background: linear-gradient(180deg, #7b1e3a 0%, #962746 100%) !important;
          box-shadow: 0 8px 20px rgba(123,30,58,.35);
        }
      `}</style>
    </main>
  )
}
