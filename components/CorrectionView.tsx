// components/CorrectionView.tsx
import React from 'react'

type Props = {
  body: string
  globalComment: string
  cta: React.ReactNode // ex: <PaymentPanel />
}

export default function CorrectionView({ body, globalComment, cta }: Props) {
  const len = body.length
  const part = (r: number) => Math.floor(len * r)

  // visible : début (20%) + un paragraphe central (10%) — sans afficher "Extrait du milieu"
  const start = body.slice(0, part(0.2))
  const middle = body.slice(part(0.45), part(0.55))

  const justify: React.CSSProperties = { whiteSpace: 'pre-wrap', textAlign: 'justify' }
  const blurBlock: React.CSSProperties = {
    filter: 'blur(6px)',
    pointerEvents: 'none',
    userSelect: 'none',
    position: 'relative',
    zIndex: 1,
  }

  // Carré bordeaux chic (centré) — bleu charte: #0f2a5f ; bordeaux: #7b1e3a
  const overlayWrap: React.CSSProperties = {
    position: 'absolute',
    inset: 0 as any,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 30,
  }
  const burgundyBox: React.CSSProperties = {
    background: '#7b1e3a',
    color: '#fff',
    borderRadius: 12,
    padding: '16px 18px',
    boxShadow: '0 10px 30px rgba(10,26,61,.25)',
    maxWidth: 380,
    width: '90%',
    textAlign: 'center',
    pointerEvents: 'auto',
    border: '1px solid rgba(255,255,255,0.08)',
  }
  const burgundyTitle: React.CSSProperties = {
    margin: '0 0 8px',
    fontWeight: 900,
    letterSpacing: '.3px',
  }
  const burgundyText: React.CSSProperties = {
    margin: '0 0 10px',
    opacity: 0.95,
  }

  return (
    <>
      {/* Début visible */}
      <h3>Début</h3>
      <p style={justify}>{start}</p>

      {/* Corps flouté (1) */}
      <div style={blurBlock}>
        <p style={justify}>{body.slice(part(0.2), part(0.45))}</p>
      </div>

      {/* Paragraphe central visible (sans le titre) */}
      <p style={justify}>{middle}</p>

      {/* Corps flouté (2) */}
      <div style={blurBlock}>
        <p style={justify}>{body.slice(part(0.55))}</p>
      </div>

      {/* Commentaire global : tout flouté */}
      <h3>Commentaire global</h3>
      <div style={blurBlock}>
        <p style={justify}>{globalComment}</p>
      </div>

      {/* Carré bordeaux centré */}
      <div style={overlayWrap} aria-hidden>
        <div style={burgundyBox} aria-label="Débloquer la correction">
          <div style={burgundyTitle}>Débloquer la correction</div>
          <div style={burgundyText}>Accédez à l’intégralité de votre copie corrigée.</div>
          {cta}
        </div>
      </div>
    </>
  )
}
