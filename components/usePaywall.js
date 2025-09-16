'use client'
import { useEffect, useMemo, useState } from 'react'

export function usePaywall(submissionId) {
  const [status, setStatus] = useState('queued') // queued|running|ready|failed
  const [correctionId, setCorrectionId] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!submissionId) return
    let t
    async function tick() {
      const r = await fetch(`/api/corrections/status?submissionId=${encodeURIComponent(submissionId)}`, { cache:'no-store' })
      const data = await r.json()
      if (data.status) setStatus(data.status)
      if (data.preview) setPreview(data.preview)
      if (data.correctionId) setCorrectionId(data.correctionId)
      if (data.status === 'ready') clearInterval(t)
    }
    tick()
    t = setInterval(tick, 4000)
    return () => clearInterval(t)
  }, [submissionId])

  const startCheckout = useMemo(() => {
    return async (priceId) => {
      if (!submissionId) return
      const r = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priceId ? { submissionId, priceId } : { submissionId }),
      })
      const data = await r.json()
      if (data?.url) window.location.href = data.url
      else alert('Erreur de paiement')
    }
  }, [submissionId])

  return { status, correctionId, preview, startCheckout }
}
