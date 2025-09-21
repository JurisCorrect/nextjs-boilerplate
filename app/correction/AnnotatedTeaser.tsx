"use client"

import React, { useEffect, useState } from "react"
import PaymentPanel from "./PaymentPanel"

export default function AnnotatedTeaser({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Déclencher la génération une seule fois
    fetch('/api/corrections/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId })
    })

    // Arrêter le loading après 2 minutes
    const timer = setTimeout(() => {
      setLoading(false)
    }, 120000)

    return () => clearTimeout(timer)
  }, [submissionId])

  if (loading) {
    return (
      <section className="panel" style={{ display: "grid", placeItems: "center", minHeight: "26vh", padding: "20px" }}>
        <div style={{ display: "grid", placeItems: "center", gap: 14, textAlign: "center" }}>
          <div 
            style={{
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              border: "3px solid rgba(123,30,58,.25)", 
              borderTopColor: "#7b1e3a", 
              animation: "spin 1s linear infinite" 
            }} 
          />
          <p style={{ margin: 0, lineHeight: 1.5, fontSize: "clamp(18px, 2vw, 22px)" }}>
            Votre correction est en cours de génération…
          </p>
          <button 
            onClick={() => setLoading(false)}
            style={{
              background: "#7b1e3a",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Voir correction (test)
          </button>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </section>
    )
  }

  // Interface de test avec correction factice
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

      <div style={{ whiteSpace: "pre-wrap", textAlign: "justify", lineHeight: 1.6 }}>
        Voici votre copie avec quelques <span style={{background: "rgba(244, 67, 54, 0.3)", padding: "1px 2px", borderRadius: "3px"}}>commentaires de test</span> pour voir l'interface sans le bug de polling.
        
        Une fois que l'API fonctionne, on remplacera par la vraie correction.
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
