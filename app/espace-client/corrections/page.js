'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function CorrectionsPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [rows, setRows] = useState([])

  const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const envOk = Boolean(ENV_URL && ENV_KEY)

  if (typeof window === 'undefined') {
    return <main style={{ background:'#fff', minHeight:'100vh' }} />
  }

  const getSupabase = useMemo(() => async () => {
    const { createClient } = await import('@supabase/supabase-js')
    if (!envOk) throw new Error('Variables Supabase manquantes')
    return createClient(ENV_URL, ENV_KEY)
  }, [ENV_URL, ENV_KEY, envOk])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await getSupabase()
        const { data } = await s.auth.getUser()
        if (!mounted) return
        if (!data?.user) { window.location.href = '/login'; return }
        setUser(data.user)

        // ---- CHARGER LES CORRECTIONS (table "corrections") ----
        // Colonnes possibles : id, user_id, type, subject, title, submitted_at, pdf_url, storage_bucket, storage_path
        const { data: list, error } = await s
          .from('corrections')
          .select('id,type,subject,title,submitted_at,pdf_url,storage_bucket,storage_path')
          .eq('user_id', data.user.id)
          .order('submitted_at', { ascending: false })
          .limit(50)

        if (error) {
          // Table manquante ou autre : on affiche un message soft mais on laisse l’UI
          setMsg({ type:'err', text: "Impossible de lire les corrections (table 'corrections' non trouvée ?)" })
          setRows([])
        } else {
          setRows(Array.isArray(list) ? list : [])
        }
      } catch (e) {
        setMsg({ type:'err', text: e.message })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  // ----- THEME (mêmes tokens que ta home) -----
  const BRAND = 'var(--brand)'
  const BRAND2 = 'var(--brand-2)'
  const MUTED = 'var(--muted)'
  const cta = {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'10px 16px', borderRadius:14, fontWeight:800,
    background:'linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)',
    color:'#fff', textDecoration:'none', border:'none', boxShadow:'0 12px 30px rgba(123,30,58,.35)', cursor:'pointer'
  }
  const card = {
    background:'#fff', borderRadius:16,
    padding:'clamp(18px, 2.4vw, 26px)',
    boxShadow:'0 10px 30px rgba(0,0,0,.08)', border:'1px solid rgba(0,0,0,.04)'
  }

  function formatDate(d) {
    try { return new Date(d).toLocaleDateString('fr-FR') } catch { return '—' }
  }
  function typeLabel(t) {
    if (!t) return 'Correction'
    const map = {
      'dissertation': 'Dissertation',
      'commentaire': "Commentaire d'arrêt / Fiche",
      'cas-pratique': 'Cas pratique'
    }
    return map[t] || 'Correction'
  }

  // Obtenir un lien PDF : direct (pdf_url http/https) ou signé via Storage
  async function getPdfLink(row) {
    if (row?.pdf_url && /^https?:\/\//i.test(row.pdf_url)) return row.pdf_url
    if (row?.storage_bucket && row?.storage_path) {
      try {
        const s = await getSupabase()
        // crée un lien signé 60 min
        const { data, error } = await s.storage.from(row.storage_bucket).createSignedUrl(row.storage_path, 3600)
        if (!error && data?.signedUrl) return data.signedUrl
      } catch {}
    }
    return null
  }

  async function handleOpenPdf(row, e) {
    e.preventDefault()
    const url = await getPdfLink(row)
    if (url) window.open(url, '_blank', 'noopener')
    else setMsg({ type:'err', text:"PDF indisponible pour cette correction" })
  }

  const total = rows.length
  const totalLabel = `${total} correction${total > 1 ? 's' : ''}`

  return (
    <main style={{ background:'#fff', minHeight:'100vh' }}>
      <div className="container" style={{ padding:'20px 16px 0' }}>
        <section style={{ ...card, marginInline:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <h1 style={{ color:BRAND, fontWeight:900, margin:0, lineHeight:1.05 }}>Mes corrections</h1>
            <Link href="/espace-client" style={cta}>← Retour</Link>
          </div>
          <p style={{ color:MUTED, margin:'8px 0 0' }}>
            {totalLabel} pour <strong style={{ color:'#222' }}>{user?.email || ''}</strong>.
          </p>
        </section>
      </div>

      <div className="container" style={{ padding:'18px 16px 44px' }}>
        {/* === États : chargement / vide / liste === */}
        {loading ? (
          <section style={{ ...card }}>
            <p style={{ color:MUTED, margin:0 }}>Chargement…</p>
          </section>
        ) : total === 0 ? (
          <section style={{ ...card }}>
            <h3 style={{ color:BRAND, fontWeight:900, marginTop:0 }}>Aucune correction pour l’instant</h3>
            <p style={{ color:MUTED, marginTop:6 }}>Quand vous soumettrez un devoir, il s’affichera ici avec la date et le PDF.</p>
            <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap' }}>
              <Link href="/dissertation" style={cta}>+ Nouvelle dissertation</Link>
              <Link href="/commentaire" style={cta}>+ Nouveau commentaire</Link>
              <Link href="/cas-pratique" style={cta}>+ Nouveau cas pratique</Link>
            </div>
          </section>
        ) : (
          <section style={{ ...card }}>
            {/* En-tête tableau */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr 180px 140px',
              gap:12, padding:'8px 6px', color:'#222', fontWeight:800
            }}>
              <div>Titre</div>
              <div>Date de soumission</div>
              <div>Téléchargement</div>
            </div>
            <div style={{ height:1, background:'rgba(0,0,0,.06)', margin:'6px 0 8px' }} />

            {/* Lignes */}
            {rows.map((r) => {
              const titre =
                r?.title ||
                [typeLabel(r?.type), r?.subject].filter(Boolean).join(' — ') ||
                'Correction'
              return (
                <div key={r.id} style={{
                  display:'grid',
                  gridTemplateColumns:'1fr 180px 140px',
                  gap:12, padding:'12px 6px', alignItems:'center', color:'#222'
                }}>
                  <div>{titre}</div>
                  <div style={{ color:MUTED }}>{formatDate(r?.submitted_at)}</div>
                  <div>
                    <a href="#" onClick={(e)=>handleOpenPdf(r, e)} style={{ ...cta, padding:'8px 14px', boxShadow:'none' }}>
                      PDF
                    </a>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {!envOk && (
          <p style={{ color:'#b71c1c', marginTop:12 }}>
            Variables Supabase absentes. Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel.
          </p>
        )}
      </div>

      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:10,
          padding:'10px 14px', borderRadius:12,
          background: msg.type==='ok' ? 'rgba(46,125,50,0.12)' : 'rgba(183,28,28,0.12)',
          color: msg.type==='ok' ? '#2e7d32' : '#b71c1c', fontWeight:700
        }}>{msg.text}</div>
      )}
    </main>
  )
}
