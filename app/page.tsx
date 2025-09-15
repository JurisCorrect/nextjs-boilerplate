"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUserNeedsPassword = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("Utilisateur connecté détecté, redirection vers /auth/callback");
          router.push('/auth/callback');
        }
      } catch (error) {
        console.log("Erreur vérification session:", error);
      }
    };
    checkUserNeedsPassword();
  }, [router]);

  // Pastilles de la nav (alignées à droite)
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
      {/* ===== NAV (droite, avec Tarifs + Se connecter) ===== */}
      <header className="nav nav-blur">
        <div
          className="container"
          style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}
        >
          <nav className="nav-links" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/tarifs" className="nav-link" style={pill}>Tarifs</Link>
            <Link href="/login" className="btn-login" style={cta}>Se connecter</Link>
          </nav>
        </div>
      </header>

      {/* ===== HERO (titre supprimé car maintenant dans nav) ===== */}
      <section className="hero">
        {/* Le titre est maintenant géré par le CSS dans .nav::before */}
      </section>

      {/* ===== PRÉSENTATION (resserrée) ===== */}
      <div className="container">
        <section className="presentation card-glass" style={{ marginInline: "auto" }}>
          <p>
            En droit, la méthodologie compte plus que tout dans la note, et c'est pourtant la plus difficile à acquérir.
            JURISCORRECT propose une correction de A à Z&nbsp;: il identifie précisément ce qui ne va pas dans votre copie,
            explique pourquoi et vous montre comment corriger le tir, pour travailler vos points faibles et progresser
            réellement. Cette correction automatisée s'appuie sur ma base de données personnelle, alignée sur les
            méthodologies universitaires, un socle introuvable dans les IA généralistes actuelles. JURISCORRECT est
            un produit unique, pensé pour faire gagner des points grâce à la méthode.
          </p>
        </section>
      </div>

      {/* ===== CARTES EXERCICES (directement visibles) ===== */}
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
        <div
          className="card-glass"
          style={{
            maxWidth: 980,
            margin: "16px auto 36px",
            padding: "clamp(16px, 2.4vw, 24px)",
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "row",
            gap: 20,
            alignItems: "flex-start"
          }}>
            {/* Texte à gauche */}
            <div style={{ flex: "1 1 auto" }}>
              <p style={{ 
                color: "var(--muted)", 
                lineHeight: 1.7, 
                margin: 0, 
                textAlign: "justify" 
              }}>
                <span
                  id="qsj-badge"
                  className="badge-accent"
                  data-badge="accent"
                  style={{
                    display: "inline-block",
                    verticalAlign: "baseline",
                    marginRight: 10,
                    padding: "4px 10px",
                    borderRadius: 8,
                    fontWeight: 900,
                    fontSize: "0.95rem",
                    letterSpacing: ".2px",
                    whiteSpace: "nowrap",
                    color: "#fff",
                    background: "linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)",
                    boxShadow: "0 8px 20px rgba(123,30,58,.35)",
                  }}
                >
                  Qui suis-je ?
                </span>
                Doctorante en droit international pénal et professeur particulier depuis quatre ans, j'ai effectué un parcours
                universitaire rigoureux, validé mention bien à chaque étape. Après une licence à l'université de Créteil,
                j'ai obtenu deux masters : un master 1 et 2 de droit international et droit comparé à Nanterre, puis un master 1
                et 2 de droit pénal et sciences criminelles à Toulouse. Au fil de mes années d'enseignement, j'ai constaté que le
                plus grand défi des étudiants en droit était la maîtrise de la méthodologie. C'est pourquoi j'ai créé JURISCORRECT :
                pour démocratiser l'accès à une correction de qualité et permettre à chaque étudiant de progresser efficacement.
                Il s'agit de ma correction basée sur mes critères et non pas ceux d'Internet. Avec quatre ans d'expérience et un
                taux de réussite de 100 % parmi mes élèves, je mets aujourd'hui mon expertise à votre service à travers cet outil.
              </p>
            </div>

            {/* Photo à droite */}
            <div style={{
              flex: "0 0 180px",
              display: "flex",
              justifyContent: "center"
            }}>
              <img
                src="/marie.jpg"
                alt="Marie"
                style={{
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,.7)",
                  boxShadow: "0 8px 24px rgba(0,0,0,.35)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===== POUR ALLER PLUS LOIN ===== */}
      <section className="container" style={{ marginBottom: 40 }}>
        <div
          className="card-glass"
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: "clamp(16px, 2.4vw, 24px)",
          }}
        >
          <h3 style={{
            color: "#fff",
            fontSize: "1.2rem",
            fontWeight: 800,
            marginBottom: 16,
            marginTop: 0
          }}>
            <span
              className="badge-accent"
              data-badge="accent"
              style={{
                display: "inline-block",
                verticalAlign: "baseline",
                marginRight: 10,
                padding: "4px 10px",
                borderRadius: 8,
                fontWeight: 900,
                fontSize: "0.95rem",
                letterSpacing: ".2px",
                whiteSpace: "nowrap",
                color: "#fff",
                background: "linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)",
                boxShadow: "0 8px 20px rgba(123,30,58,.35)",
              }}
            >
              Pour aller plus loin...
            </span>
          </h3>
          <p style={{ 
            color: "var(--muted)", 
            lineHeight: 1.7, 
            margin: 0, 
            textAlign: "justify" 
          }}>
            Au-delà de l'outil JURISCORRECT, je propose également un accompagnement personnalisé sous forme de cours particuliers. 
            Ces sessions permettent un suivi individualisé, des explications détaillées de la méthodologie juridique et un 
            entraînement adapté à vos besoins spécifiques. Que vous souhaitiez préparer un examen, améliorer vos techniques 
            de dissertation ou perfectionner vos commentaires d'arrêt, je vous accompagne dans votre progression avec une 
            pédagogie éprouvée et des résultats concrets.
            <br /><br />
            Pour toute demande d'information ou pour planifier un accompagnement personnalisé, contactez-moi directement  : 
            <a href="mailto:marie.terki@icloud.com" style={{
              color: "var(--brand)",
              textDecoration: "none",
              fontWeight: 700
            }}>
              <strong>marie.terki@icloud.com</strong>
            </a>
          </p>
        </div>
      </section>

      {/* Forçage ciblé de la couleur du texte du badge "Qui suis-je ?" */}
      <style>{`#qsj-badge { color: #fff !important; }`}</style>
    </main>
  )
}
