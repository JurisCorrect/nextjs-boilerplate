'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Merci2Page() {
  const [corrLink, setCorrLink] = useState('/correction-complete')
  const [ver, setVer] = useState('')

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      const id = q.get('id') || q.get('submissionId') || q.get('correctionId')
      if (id) setCorrLink(`/correction/${encodeURIComponent(id)}`)
    } catch {}
    setVer(new Date().toLocaleString('fr-FR'))
  }, [])

  const BRAND = 'var(--brand)'
  const BRAND2 = 'var(--brand-2)'
  const MUTED = 'var(--muted)'

  const card = {
    background:'#fff', borderRadius:16,
    padding:'clamp(18px, 2.4vw, 26px)',
    boxShadow:'0 10px 30px rgba(0,0,0,.08)',
    border:'1px solid rgba(0,0,0,.04)'
  }
  const cta = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
    padding:'12px 18px', borderRadius:14, fontWeight:800,
    background:`linear-gradient(180deg, ${BRAND} 0%, ${BRAND2} 100%)`,
    color:'#fff', textDecoration:'none', border:'none',
    boxShadow:'0 12px 30px rgba(123,30,58,.35)', cursor:'pointer', minWidth:220
  }
  const ghost = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
    padding:'12px 18px', borderRadius:14, fontWeight:800,
    background:'rgba(123,30,58,.08)', color:BRAND, textDecoration:'none',
    border:'1px solid rgba(123,30,58,.25)', cursor:'pointer', minWidth:220
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
            Merci pour votre achat. Votre paiement a bien été traité.
          </p>

        <div style={{ ...card, padding:'16px', boxShadow:'none', border:'1px dashed rgba(0,0,0,.08)', marginTop:8 }}>
            <h3 style={{ color:'#222', fontWeight:900, margin:'0 0 8px' }}>Que se passe-t-il maintenant ?</h3>
            <ul style={{ color:MUTED, margin:'0 0 8px 18px', lineHeight:1.7 }}>
              <li>Un email de confirmation vient de vous être envoyé.</li>
              <li>Votre correction est accessible immédiatement.</li>
              <li>Besoin d’aide ? <a href="mailto:marie.terki@icloud.com" style={{ color:BRAND, fontWeight:700 }}>marie.terki@icloud.com</a></li>
            </ul>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:18 }}>
            <a href={corrLink} style={cta}>Voir la correction</a>
            <Link href="/login" style={ghost}>Accéder à mon compte</Link>
          </div>

          {/* Badge version pour voir si la bonne build s’affiche */}
          <div style={{ marginTop:12, color:MUTED, fontSize:12 }}>
            version: <code>{ver}</code>
          </div>
        </section>
      </div>
    </main>
  )
}
