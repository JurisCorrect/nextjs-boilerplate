'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Merci2Page() {
  const [corrLink, setCorrLink] = useState<string | null>(null)
  const [accountLink] = useState('/login')
  const [ver, setVer] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const q = new URLSearchParams(window.location.search)

        // ✅ Cas normal : on reçoit submissionId via success_url (déjà géré dans /api/checkout)
        const submissionId =
          q.get('submissionId') ||
          q.get('submission_id') ||
          q.get('id') // compat antérieure

        if (submissionId) {
          setCorrLink(`/correction/${encodeURIComponent(submissionId)}`)
          setVer(new Date().toLocaleString('fr-FR'))
          return
        }

        // 🔁 Fallback léger : on tente via session Stripe (aucune auth requise)
        const sid = q.get('session_id') || q.get('sid') || q.get('sessionId')
        if (sid) {
          const r = await fetch(`/api/corrections/from-session?sid=${encodeURIComponent(sid)}`, { cache: 'no-store' })
          if (r.ok) {
            const d = await r.json()
            const subId = d?.submissionId || d?.submission_id
            if (subId) {
              setCorrLink(`/correction/${encodeURIComponent(subId)}`)
              setVer(new Date().toLocaleString('fr-FR'))
              return
            }
            // compat si l’API renvoie directement l’id de correction
            if (d?.correctionId) {
              setCorrLink(`/correction/${encodeURIComponent(d.correctionId)}`)
              setVer(new Date().toLocaleString('fr-FR'))
              return
            }
          }
        }

        // 🧯 Dernier filet : accueil
        setCorrLink('/')
        setVer(new Date().toLocaleString('fr-FR'))
      } catch {
        setCorrLink('/')
        setVer(new Date().toLocaleString('fr-FR'))
      }
    })()
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
    minWidth:220,
    opacity: corrLink ? 1 : .6,
    pointerEvents: corrLink ? 'auto' : 'none'
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
            Merci pour ton achat. Ta correction est accessible immédiatement.
          </p>

          <div style={{ ...card, padding:'16px', boxShadow:'none', border:'1px dashed rgba(0,0,0,.08)', marginTop:8 }}>
            <h3 style={{ color:'#222', fontWeight:900, margin:'0 0 8px' }}>Et maintenant&nbsp;?</h3>
            <ul style={{ color:MUTED, margin:'0 0 8px 18px', lineHeight:1.7 }}>
              <li>📬 Pense à vérifier tes spams (email de confirmation / création de mot de passe).</li>
              <li>🧾 Aucun compte requis pour voir la correction payée.</li>
              <li>🗝️ Tu peux créer un compte plus tard pour tout retrouver au même endroit.</li>
            </ul>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:18 }}>
            <a href={corrLink || '#'} style={cta}>
              {corrLink ? 'Voir la correction' : 'Préparation du lien…'}
            </a>
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
