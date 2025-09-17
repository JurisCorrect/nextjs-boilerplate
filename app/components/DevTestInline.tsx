'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DevTestInline() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const router = useRouter()

  async function run() {
    setLoading(true); setMsg('Création d’une soumission de démo…')
    try {
      const r = await fetch('/api/submissions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: { text:
            "Sujet : La responsabilité administrative pour faute.\n" +
            "Introduction — Depuis l'arrêt Blanco, la responsabilité de l'administration…\n" +
            "I. La faute simple demeure le principe…\nII. Vers un régime plus objectif…\nConclusion."
          }
        }),
      })
      const d = await r.json()
      if (!r.ok || !d?.submissionId) throw new Error(d?.error || 'create_failed')
      setMsg('Redirection vers la page CORRECTION…')
      router.replace(`/correction/${encodeURIComponent(d.submissionId)}`)
    } catch (e: any) {
      setMsg('Erreur : ' + (e?.message || 'inconnue'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 16, display:'inline-flex', alignItems:'center', gap:10 }}>
      <button onClick={run} disabled={loading}
        style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', cursor:'pointer' }}>
        {loading ? '…' : '🔧 Tester une correction'}
      </button>
      {msg && <small style={{ opacity:.8 }}>{msg}</small>}
    </div>
  )
}
