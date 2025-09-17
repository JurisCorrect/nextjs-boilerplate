'use client'
import { useState, useMemo } from 'react'

export default function CheckoutAccountBlock({
  apiPath = '/api/checkout',
  payload = {},
  successUrl = '/correction-complete',
  cancelUrl = '/login',
  submissionId,                // 👈 OBLIGATOIRE
}) {
  // … état inchangé …

  async function startCheckout(e) {
    e.preventDefault()
    setMsg(null); setBusy(true)

    try {
      const ok = await maybeCreateAccount()
      if (!ok) { setBusy(false); return }

      // Ajoute le submissionId au payload
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          submission_id: submissionId,                     // 👈 passe-le au backend
          customer_email: email.trim(),
          // Ajoute aussi en query sur la successUrl pour la page de retour
          success_url: `${successUrl}?submissionId=${encodeURIComponent(submissionId)}`, // 👈
          cancel_url: cancelUrl,
        }),
      })

      if (!res.ok) throw new Error('Échec création session de paiement')
      const data = await res.json()
      if (!data?.url) throw new Error('URL de paiement introuvable')
      window.location.href = data.url
    } catch (err) {
      setMsg({ type:'err', text: err.message || 'Erreur paiement' })
      setBusy(false)
    }
  }

  // … rendu JSX inchangé …
}
