// app/soumission/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SoumissionPage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch('/api/submissions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: { text } }),
      })
      const data = await r.json()
      if (!r.ok || !data?.submissionId) {
        throw new Error(data?.error || 'create_failed')
      }
      // redirige vers le paywall avec l’ID
      router.push(`/paywall?submissionId=${encodeURIComponent(data.submissionId)}`)
    } catch (e: any) {
      setErr(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Envoyer pour correction</h1>
      <form onSubmit={onSubmit} style={{ display:'grid', gap:12, maxWidth:700 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Colle ton texte ici…"
          style={{ width:'100%' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer'}
        </button>
        {err && <p style={{ color:'crimson' }}>{err}</p>}
      </form>
    </main>
  )
}
