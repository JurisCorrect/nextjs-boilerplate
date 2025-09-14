// app/api/stripe-cancel/route.js
import { NextResponse } from 'next/server'

export async function GET(req) {
  const url = new URL(req.url)
  return NextResponse.redirect(new URL(`/paiement-annule${url.search || ''}`, url.origin), 302)
}

export async function POST(req) {
  return GET(req)
}
