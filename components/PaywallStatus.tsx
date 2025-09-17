'use client'

import { useEffect, useRef, useState } from 'react'

type Props = { submissionId: string }
type StatusResp = {
  correctionId?: string
  status?: 'none' | 'running' | 'ready'
  result?: any
  error?: string
}

export default function PaywallStatus({ submissionId }: Props) {
  const [data, setData] = useState<StatusResp | null>(null)
  const timer = useRef<any>(null)

  async function load() {
    try {
      const r = await fetch(`/api/corrections/status?submissionId=${encodeURIComponent(submissionId)}`, { cache: 'no-store' })
      const j: StatusResp = await r.json()
      setData(j)
    } catch {}
  }

  useEffect(() => {
    load()
    timer.current = setInterval(load, 2500)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [submissionId])

  const status = data?.status || 'running'
  const ready = status === 'ready'
  const result = data?.result || {}
  const body: string = result?.normalizedBody ?? result?.body ?? ''
  const comment: string = result?.globalComment ?? result?.global_comment ?? ''

  if (!ready) {
    return (
      <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--muted)' }}>
        Préparation en cours…
      </div>
    )
  }

  const take = (s: string, n = 600) => (s || '').slice(0, n)

  return (
    <div style={{ marginTop: 18 }}>
      <h3 style={{ margin: '8px 0' }}>Aperçu</h3>
      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{take(body)}</div>
      {comment ? (
        <>
          <h4 style={{ margin: '12px 0 6px' }}>Commentaire global</h4>
          <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>{take(comment, 300)}</div>
        </>
      ) : null}
    </div>
  )
}
