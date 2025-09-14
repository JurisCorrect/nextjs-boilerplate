// app/api/stripe-success/route.js
import { NextResponse } from 'next/server'

// Stripe appellera cette URL en GET (et parfois POST). On gère les deux.
export async function GET(req) {
  const url = new URL(req.url)
  const qs = url.search ? url.search : ''
  // Redirige vers /merci2 en conservant les paramètres éventuels ?id=...
  return NextResponse.redirect(new URL(`/merci2${qs}`, url.origin), 302)
}

export async function POST(req) {
  // Si Stripe faisait un POST, on fait la même redirection.
  return GET(req)
}
