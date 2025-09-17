"use client"

import React, { useEffect, useState } from "react"

type StatusPayload = {
  submissionId: string
  status: "none" | "running" | "ready"
  result?: {
    normalizedBody?: string
    body?: string
    inline?: Array<{ tag?: string; quote?: string; comment?: string }>
  } | null
}

export default function AnnotatedTeaser({ submissionId }: { submissionId: string }) {
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchStatus() {
      try {
        console.log('Fetching status for:', submissionId)
        
        const response = await fetch(`/api/corrections/status?submissionId=${encodeURIComponent(submissionId)}`, {
          cache: "no-store"
        })
        
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        console.log('API result:', result)
        
        if (mounted) {
          setData(result)
          if (result.status === "ready") {
            setLoading(false)
          } else {
            // Continue polling if not ready
            setTimeout(fetchStatus, 2000)
          }
        }
      } catch (err) {
        console.error('Fetch error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Network error')
          setLoading(false)
        }
      }
    }

    fetchStatus()
    return () => { mounted = false }
  }, [submissionId])

  // Debug: show what we have
  console.log('Component state:', { data, loading, error })

  if (error) {
    return (
      <section className="panel" style={{ padding: "20px" }}>
        <h3>Erreur</h3>
        <p>submissionId: {submissionId}</p>
        <p>Erreur: {error}</p>
        <button onClick={() => window.location.reload()}>Recharger</button>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="panel" style={{ padding: "20px", textAlign: "center" }}>
        <div>Chargement en cours...</div>
        <div>submissionId: {submissionId}</div>
        <div>Status: {data?.status || 'unknown'}</div>
      </section>
    )
  }

  if (!data || data.status !== "ready") {
    return (
      <section className="panel" style={{ padding: "20px" }}>
        <p>Status: {data?.status || 'none'}</p>
        <p>Data: {JSON.stringify(data, null, 2)}</p>
      </section>
    )
  }

  const result = data.result || {}
  const body = result.normalizedBody ?? result.body ?? ""
  const inline = result.inline || []

  return (
    <section className="panel" style={{ padding: "20px" }}>
      <h3>Correction Ready</h3>
      <div>
        <strong>Body length:</strong> {body.length}
      </div>
      <div>
        <strong>Inline comments:</strong> {inline.length}
      </div>
      
      {body && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          <h4>Preview (first 200 chars):</h4>
          <p>{body.slice(0, 200)}...</p>
        </div>
      )}
      
      {inline.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h4>Comments:</h4>
          {inline.slice(0, 2).map((comment, i) => (
            <div key={i} style={{ padding: "10px", margin: "5px 0", border: "1px solid #ddd" }}>
              <strong>Tag:</strong> {comment.tag || 'none'}<br/>
              <strong>Quote:</strong> {comment.quote || 'none'}<br/>
              <strong>Comment:</strong> {comment.comment || 'none'}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
