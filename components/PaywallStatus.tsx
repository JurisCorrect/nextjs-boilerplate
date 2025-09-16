// components/PaywallStatus.tsx
'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

type Score = { overall?: number; out_of?: number } | null
type InlineItem = { tag: 'green'|'red'|'orange'|'blue'; quote: string; comment: string }
type Preview = { inline: InlineItem[]; global_intro: string; score?: Score }
type Status = 'pending'|'queued'|'running'|'ready'|'failed'

type Props = {
  submissionId?: string
  correctionId?: string
  intervalMs?: number
  maxWaitMs?: number
  showSpinner?: boolean
}

export default function PaywallStatus({
  submissionId,
  correctionId,
  intervalMs = 4000,
  maxWaitMs = 30000,     // ➜ cap à 30 s
  showSpinner = true,
}: Props) {
  const [status, setStatus] = useState<Status>('pending')
  const [cid, setCid] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const timerRef = useRef<any>(null)
  const deadlineRef = useRef<number>(Date.now() + maxWaitMs)

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (submissionId) p.set('submissionId', submissionId)
    if (correctionId) p.set('correctionId', correctionId)
    return p.toString()
  }, [submissionId, correctionId])

  useEffect(() => {
    if (!qs) return
    let iv: any

    async function tick() {
      try {
        const r = await fetch(`/api/corrections/status?${qs}`, { cache: 'no-store' })
        const data = await r.json()
        if (data.status) setStatus(data.status as Status)
        if (data.correctionId) setCid(data.correctionId as string)
        if (data.preview) setPreview(data.preview as Preview)
        if (data.status === 'ready') {
          clearInterval(iv)
          clearTimeout(timerRef.current)
          setTimedOut(false)
        }
      } catch {}
      if (Date.now() >= deadlineRef.current) {
        setTimedOut(true)
        clearInterval(iv)
      }
    }

    tick()
    iv = setInterval(tick, intervalMs)
    timerRef.current = setTimeout(() => {
      setTimedOut(true)
      clearInterval(iv)
    }, maxWaitMs)

    return () => {
      clearInterval(iv)
      clearTimeout(timerRef.current)
    }
  }, [qs, intervalMs, maxWaitMs])

  // UI (ne touche pas ton design principal : c’est un bloc autonome que tu places où tu veux)
  return (
    <div style={{ display:'grid', gap:12 }}>
      {/* état/loader */}
      <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
        {showSpinner && status !== 'ready' && !timedOut && (
          <span
            aria-label="Chargement en cours"
            style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid rgba(123,30,58,.25)',
              borderTopColor: '#7b1e3a',
              animation: 'spin 1s linear infinite'
            }}
          />
        )}
        <small style={{ opacity:.8 }}>
          {timedOut
            ? "Toujours en cours… Réessaie dans quelques secondes."
            : status === 'ready'
              ? "Prêt."
              : "Préparation en cours…"}
        </small>
      </div>

      {/* aperçus gratuits */}
      {preview && (
        <div style={{ border:'1px solid rgba(0,0,0,.08)', borderRadius:10, padding:12 }}>
          {preview.score?.overall != null && (
            <p style={{ margin:'0 0 8px' }}>
              Note indicative : <strong>{preview.score.overall}</strong> / {preview.score.out_of ?? 20}
            </p>
          )}
          <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:8 }}>
            {(preview.inline || []).map((it, i) => (
              <li key={i} style={{ border:'1px solid rgba(0,0,0,.08)', borderRadius:8, padding:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span
                    title={it.tag}
                    style={{
                      width: 10, height: 10, borderRadius: 3, display:'inline-block',
                      background: it.tag === 'green' ? '#16a34a' : it.tag === 'red' ? '#dc2626' : it.tag === 'orange' ? '#ea580c' : '#2563eb',
                    }}
                  />
                  <em>« {it.quote} »</em>
                </div>
                <p style={{ marginTop:6 }}>{it.comment}</p>
              </li>
            ))}
          </ul>
          {preview.global_intro && <p style={{ marginTop:10, opacity:.9 }}>{preview.global_intro}…</p>}
        </div>
      )}

      {/* lien “Voir la correction” si prêt (tu gardes ton overlay/paywall pour le paiement) */}
      {status === 'ready' && cid && (
        <div style={{ textAlign:'center' }}>
          <a href={`/correction/${cid}`} style={{ fontWeight:700, textDecoration:'underline' }}>
            Voir la correction
          </a>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
