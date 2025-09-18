'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function Merci2Page() {
  const [corrLink, setCorrLink] = useState(null)     // lien "Voir la correction"
  const [accountLink] = useState('/login')           // on garde /login comme tu veux
  const [ver, setVer] = useState('')
  const [loading, setLoading] = useState(true)

  const base = useMemo(() => {
    const env = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    if (env) return env
    if (typeof window !== 'undefined') return window.location.origin
    return ''
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const q = new URLSearchParams(window.location.search)
        const directId =
          q.get('id') || q.get('submissionId') || q.get('correctionId')
        const sid = q.get('sid') || q.get('session_id') || ''

        // 1) Déjà un ID → lien direct /correction/[id]
        if (directId) {
          if (!cancelled) {
            setCorrLink(`/correction/${encodeURIComponent(directId)}`)
            setLoading(false)
          }
          return
        }

        // 2) Sinon, on tente de résoudre par l'ID de session Stripe
        if (sid) {
          for (let i = 0; i < 20; i++) {
            try {
              const r = await fetch(
                `/api/corrections/resolve?session_id=${encodeURIComponent(sid)}`,
                { cache: 'no-store' }
              )
              const data = await r.json().catch(() => ({}))
              if (r.ok && data && data.correctionId) {
                if (!cancelled) {
                  setCorrLink(`/correction/${encodeURIComponent(data.correctionId)}`)
                  setLoading(false)
                }
                return
              }
            } catch {}
            // petite pause entre les tentatives
            await new Promise(res => setTimeout(res, 1200))
          }
        }

        // 3) Fallback si on ne peut rien déduire
        if (!cancelled) {
          setCorrLink('/')   // évite un 404
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setCorrLink('/')
          setLoading(false)
        }
      } finally {
        if (!cancelled) setVer(new Date().toLocaleString('fr-FR'))
      }
    }

    run()
    return () => { cancelled = true }
  }, [base])

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

  const disabledBtn = {
    opacity: 0.6,
    pointerEvents: 'none'
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
              <li>📬 <strong>N&apos;oublie pas de regarder dans tes courriers indésirables (spam)</strong>.</li>
              <li>
                Un email de confirmation <strong>ou</strong> un email de création de mot de passe t&apos;a été envoyé
                <em> (si c&apos;est ta première fois)</em>.
              </li>
              <li>Ta correction est accessible immédiatement.</li>
              <li>Besoin d&apos;aide ? <a href="mailto:marie.terki@icloud.com" style={{ color:BRAND, fontWeight:700 }}>marie.terki@icloud.com</a></li>
            </ul>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:18 }}>
            <a
              href={corrLink || '#'}
              style={{ ...cta, ...(loading ? disabledBtn : {}) }}
            >
              {loading ? 'Chargement...' : 'Voir la correction'}
            </a>
            
            <Link href={accountLink} style={ghost}>
              Accéder à mon compte
            </Link>
          </div>

          <div style={{ marginTop:12, color:MUTED, fontSize:12 }}>
            version: <code>{ver}</code>
          </div>
        </section>
      </div>
    </main>
  )
}
