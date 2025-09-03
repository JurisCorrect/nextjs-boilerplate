"use client"
import { useState } from "react"

export default function TestAPI() {
  const [result, setResult] = useState("")

  const testAPI = async () => {
    try {
      const res = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_kind: 'dissertation',
          matiere: 'Test',
          sujet: 'Test sujet',
          copie: 'Test copie contenu'
        })
      })
      
      const data = await res.json()
      setResult(`Status: ${res.status}\nResponse: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Erreur: ${error.message}`)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test API</h1>
      <button onClick={testAPI} style={{ padding: '10px 20px' }}>
        Tester /api/correct
      </button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '20px' }}>
        {result}
      </pre>
    </div>
  )
}
