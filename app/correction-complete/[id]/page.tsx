// app/correction-complete/[id]/page.tsx
import React from "react"

export const dynamic = "force-dynamic"

type Props = { params: { id: string } }

export default async function CorrectionCompletePage({ params }: Props) {
  const correctionId = params.id
  
  return (
    <main className="page-wrap correction">
      <h1 className="page-title">CORRECTION COMPLÈTE</h1>
      
      <div style={{
        textAlign: "center",
        marginBottom: "20px"
      }}>
        <span style={{
          display: "inline-block",
          background: "#4CAF50",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: 600
        }}>
          ✅ Correction débloquée - Version complète
        </span>
      </div>

      <section className="panel">
        <p>ID de la correction: {correctionId}</p>
        <p>Page en construction - correction complète à venir</p>
        
        <div style={{ marginTop: "40px" }}>
          <a 
            href="/"
            style={{
              display: "inline-block",
              background: "#7b1e3a",
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            Retour à l'accueil
          </a>
        </div>
      </section>
    </main>
  )
}
