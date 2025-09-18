// app/merci2/page.js
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Merci2Page() {
  // Lien vers la correction (on le résout immédiatement si possible)
  const [corrLink, setCorrLink] = useState('/correction')
  // Ton bouton “Accéder à mon compte” doit conduire à la page login qui marche déjà
  const [accountLink] = useState('/login')
  const [ver, setVer] = useState('')

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)

      // 1) Cas normal : on a l’ID de soumission directement (ajouté par /api/checkout)
      const directId =
        q.get('submissionId') ||
        q.get('submission_id') ||
        q.get('id') ||
        q.get('correctionId')

      if (directId) {
        setCorrLink(`/correction/${encodeURIComponent(directId)}`)
      } else {
        // 2) Fallback : on essaie de résoudre via l’ID de session Stripe (pas d’auth requise)
        const sid = q.get('sid') || q.get('session_id') || q.get('sessionId')
        if (sid) {
          fetch(`/api/corrections/from-session?sid=${encodeURIComponent(sid)}`, { cache: 'no-store' })
            .then(r => r.ok ? r.json() : null)
            .then(d => {
              if (d?.submissionId) {
                setCorrLink(`/correction/${encodeURIComponent(d.submissionId)}`)
              } else if (d?.correctionId) {
                // au cas où ta route renverrait l'id de correction directement
                setCorrLink(`/correction/${encodeURIComponent(d.correctionId)}`)
              } else {
                setCorrLink('/')
              }
            })
            .catch(() => setCorrLink('/'))
        } else {
          // 3) Dernière sécurité : on envoie à l’accueil si aucun identifiant n’est présent
          setCorrLink('/')
        }
      }
    } catch {
      setCorrLink('/')
    }
    setVer(new Date().toLocaleString('fr-FR'))
  }, [])

  const BRAND  = 'var(--brand)'
  const BRAND2 = 'var(--brand-2)'
  const MUTED  = 'var(--muted)'

  const card = {
    background:'#fff',
    borderRadius:16,
    padding:'clamp(18px, 2.4vw, 26px)',
    boxShadow:'0 10px 30px rgba(0,0,0,.08)',
    border:'1px solid rgba(0,0,0,.04)'
  }

  const cta = {
    display:'inline-flex',
    alignItems:'center',
    justifyContent:'center',
    gap:8,
    padding:'12px 18px',
    borderRadius:14,
    fontWeight:800,
    background: `linear-gradient(180deg, ${BRAND} 0%, ${BRAND2} 100%)`,
    color:'#fff',
    textDecoration:'none',
    border:'none',
    boxShadow:'0 12px 30px rgba(123,30,58,.35)',
    cursor:'pointer',
    minWidth:220
  }

  const ghost = {
    display:'inline-flex',
    alignItems:'center',
    justifyContent:'center',
    gap:8,
    padding:'12px 18px',
    borderRadius:14,
    fontWeight:800,
    background:'rgba(123,30,58,.08)',
    color:BRAND,
    textDecoration:'none',
    border:'1px solid rgba(123,30,58,.25)',
    cursor:'pointer',
    minWidth:220
  }

  return (
    <main style={{ background:'#fff', minHeight:'100vh' }}>
      <div style={{ position:'fixed', inset:0, background:'#fff', zIndex:0 }} />
      <div className="container" style={{ position:'relative', zIndex:1, padding:'24px 16px 40px', maxWidth:980, margin:'0 auto' }}>
        <section style={{ ...card, marginTop:12 }}>
          <h1 style={{ color:BRAND, fontWeight:900, margin:'0 0 8px', lineHeight:1.05 }}>
            Paiement réussi 🎉
          </h1>
          <p style={{ color:MUTED, margin:'0 0 18px' }}>
            Merci pour ton achat. Ton paiement a bien été traité.
          </p>

          <div style={{ ...card, padding:'16px', boxShadow:'none', border:'1px dashed rgba(0,0,0,.08)', marginTop:8 }}>
            <h3 style={{ color:'#222', fontWeight:900, margin:'0 0 8px' }}>Que se passe-t-il maintenant&nbsp;?</h3>
            <ul style={{ color:MUTED, margin:'0 0 8px 18px', lineHeight:1.7 }}>
              <li>📬 <strong>Pense à vérifier tes spams</strong>.</li>
              <li>
                Un email de confirmation <strong>ou</strong> un email de création de mot de passe t&apos;a été envoyé
                <em> (si c&apos;est ta première fois)</em>.
              </li>
              <li>Ta correction est accessible immédiatement.</li>
              <li>Besoin d&apos;aide ? <a href="mailto:marie.terki@icloud.com" style={{ color:BRAND, fontWeight:700 }}>marie.terki@icloud.com</a></li>
            </ul>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:18 }}>
            {/* Lien direct (sans état “Préparation…”) */}
            <a href={corrLink} style={cta}>Voir la correction</a>
            <Link href={accountLink} style={ghost}>Accéder à mon compte</Link>
          </div>

          <div style={{ marginTop:12, color:MUTED, fontSize:12 }}>
            version: <code>{ver}</code>
          </div>
        </section>
      </div>
    </main>
  )
}
