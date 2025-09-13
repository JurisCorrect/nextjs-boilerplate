'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

export default function AbonnementPage() {
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // {type:'ok'|'err'|'info', text:string}
  const [summary, setSummary] = useState({
    planLabel: '—',
    priceLabel: '—',
    nextBilling: null,      // ISO date string
    invoices: [],           // [{id,date,amount,url}]
  })

  // Supabase (pour vérifier la session)
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

        // Optionnel : si tu as un endpoint qui renvoie le récap billing
        // (plan, prochaine échéance, factures). On l’essaie en douceur.
        try {
          const r = await fetch('/api/billing/summary', { method: 'GET' })
          if (r.ok) {
            const json = await r.json()
            if (!mounted) return
            setSummary({
              planLabel: json.planLabel || '—',
              priceLabel: json.priceLabel || '—',
              nextBilling: json.nextBilling || null,
              invoices: Array.isArray(json.invoices) ? json.invoices : [],
            })
          }
        } catch {
          // pas grave, on laisse les valeurs par défaut
        }
      } catch (e) {
        setMsg({ type:'err', text: e?.message || 'Erreur chargement abonnement' })
      }
    })()
    return () => { mounted = false }
  }, [getSupabase])

  // -- handlers sans portail stripe --
  function handleChangePlan(e) {
    e.preventDefault()
    setMsg({
      type:'info',
      text:"La modification de plan sera bientôt disponible. Contactez-nous à marie.terki@icloud.com si besoin."
    })
  }
  function handleCancel(e) {
    e.preventDefault()
    setMsg({
      type:'info',
      text:"La résiliation en un clic arrive bientôt. En attendant, écrivez à marie.terki@icloud.com."
    })
  }

  // ------ style tokens alignés à ta home ------
  const BRAND = 'var(--brand)'
  const MUTED = 'var(--muted)'
  const cta = {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'10px 16px', borderRadius:14, fontWeight:800,
    background:'linear-gradient(180deg, var(--brand) 0%, var(--brand-2) 100%)',
    color:'#fff', textDecoration:'none', border:'none',
    boxShadow:'0 12px 30px rgba(123,30,58,.35)', cursor:'pointer'
  }
  const ghost = {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'10px 16px', borderRadius:14, fontWeight:800,
    background:'rgba(123,30,58,.08)', color:BRAND, textDecoration:'none',
    border:'1px solid rgba(123,30,58,.25)', cursor:'pointer'
  }
  const card = {
    background:'#fff', borderRadius:16,
    padding:'clamp(18px, 2.4vw, 26px)',
    boxShadow:'0 10px 30px rgba(0,0,0,.08)',
    border:'1px solid rgba(0,0,0,.04)'
  }

  const fmtDate = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('fr-FR') } catch { return '—' }
  }
  const fmtAmount = (cents, currency='EUR') => {
    if (typeof cents !== 'number') return '—'
    try { return (cents/100).toLocaleString('fr-FR', { style:'currency', currency }) } catch { return '—' }
  }

  return (
    <main style={{ background:'#fff', minHeight:'100vh' }}>
      <div className="container" style={{ padding:'20px 16px 0' }}>
        <section style={{ ...card, marginInline:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
            <h1 style={{ color:BRAND, fontWeight:900, margin:0, lineHeight:1.05 }}>Gestion de l’abonnement</h1>
            <Link href="/espace-client" style={cta}>← Retour</Link>
          </div>
          <p style={{ color:MUTED, margin:'8px 0 0' }}>
            Consultez votre plan et votre prochaine échéance. Téléchargez vos reçus ci-dessous.
          </p>
        </section>
      </div>

      <div className="container" style={{ padding:'18px 16px 44px', display:'grid', gap:18, gridTemplateColumns:'1fr', maxWidth:980, margin:'0 auto' }}>
        {/* Plan actuel */}
        <section style={{ ...card }}>
          <h3 style={{ color:BRAND, fontWeight:900, marginTop:0, marginBottom:14 }}>Plan actuel</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <div style={{ color:'#222', fontWeight:800 }}>{summary.planLabel}</div>
              <div style={{ color:MUTED, marginTop:4 }}>{summary.priceLabel}</div>
            </div>
            <div>
              <div style={{ color:'#222', fontWeight:800 }}>Prochaine date de facturation</div>
              <div style={{ color:MUTED, marginTop:4 }}>{fmtDate(summary.nextBilling)}</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
            <a href="#" onClick={handleChangePlan} style={ghost}>Changer de plan</a>
            <a href="#" onClick={handleCancel} style={ghost}>Résilier l’abonnement</a>
            {/* 🔥 Portail Stripe SUPPRIMÉ */}
          </div>
        </section>

        {/* Historique des paiements */}
        <section style={{ ...card }}>
          <h3 style={{ color:BRAND, fontWeight:900, marginTop:0, marginBottom:14 }}>Historique des paiements</h3>

          {summary.invoices.length === 0 ? (
            <p style={{ color:MUTED, margin:0 }}>
              Aucun paiement enregistré pour l’instant. Les reçus apparaîtront ici après vos achats.
            </p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 160px', gap:12, fontWeight:800, color:'#222', padding:'6px 0' }}>
              <div>Date</div>
              <div>Montant</div>
              <div>Télécharger</div>
              {summary.invoices.map((inv) => (
                <div key={inv.id} style={{ display:'contents', fontWeight:500 }}>
                  <div style={{ color:MUTED }}>{fmtDate(inv.date)}</div>
                  <div style={{ color:'#222' }}>{fmtAmount(inv.amount, inv.currency || 'EUR')}</div>
                  <div>
                    {inv.url ? (
                      <a href={inv.url} target="_blank" rel="noopener" style={cta}>PDF</a>
                    ) : (
                      <span style={{ color:MUTED }}>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {msg && (
        <div style={{
          position:'fixed', right:16, bottom:16, zIndex:10,
          padding:'10px 14px', borderRadius:12,
          background:
            msg.type==='ok'  ? 'rgba(46,125,50,0.12)' :
            msg.type==='err' ? 'rgba(183,28,28,0.12)' : 'rgba(123,30,58,0.12)',
          color:
            msg.type==='ok'  ? '#2e7d32' :
            msg.type==='err' ? '#b71c1c' : 'var(--brand)',
          fontWeight:700
        }}>{msg.text}</div>
      )}

      {!envOk && (
        <div style={{ maxWidth:980, margin:'10px auto', color:'#b71c1c' }}>
          Variables Supabase absentes. Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans Vercel.
        </div>
      )}
    </main>
  )
}
