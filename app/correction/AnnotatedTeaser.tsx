"use client"

import React from "react"
import PaymentPanel from "./PaymentPanel"

export default function AnnotatedTeaser({ submissionId }: { submissionId: string }) {
  // Version statique - aucun useEffect, aucun état qui change = aucun clignotement
  
  return (
    <section className="panel" style={{ position: "relative" }}>
      <div style={{
        textAlign: "center",
        fontSize: "16px",
        color: "#333",
        marginBottom: "20px",
        fontStyle: "italic",
        padding: "8px 12px",
        background: "rgba(123, 30, 58, 0.05)",
        borderRadius: "6px",
        border: "1px solid rgba(123, 30, 58, 0.1)"
      }}>
        Il faut appuyer sur les parties surlignées pour voir les commentaires
      </div>

      <div style={{ whiteSpace: "pre-wrap", textAlign: "justify", lineHeight: 1.6, filter: "blur(6px)" }}>
        Voici votre copie corrigée par Marie Terki. Cette interface de démonstration montre le rendu final avec commentaires cliquables.
        
        Les passages surlignés en couleur correspondent aux commentaires détaillés de correction selon la méthodologie universitaire rigoureuse.
        
        Une analyse complète de 25-35 points spécifiques sera visible après déverrouillage.
        
        La correction inclut l'analyse méthodologique, les points forts, les axes d'amélioration et les conseils personnalisés.
      </div>

      {/* Overlay paywall */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 30
        }}
      >
        <div
          style={{
            background: "#7b1e3a",
            color: "#fff",
            borderRadius: 12,
            padding: "16px 18px",
            boxShadow: "0 10px 30px rgba(10,26,61,.25)",
            maxWidth: 420,
            width: "92%",
            textAlign: "center",
            pointerEvents: "auto",
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 6, letterSpacing: ".3px" }}>
            Débloquer la correction
          </div>
          <div style={{ opacity: 0.95, marginBottom: 12 }}>
            Accède à l'intégralité de ta copie corrigée et à tous les commentaires.
          </div>
          <PaymentPanel refId={submissionId} />
        </div>
      </div>
    </section>
  )
}
