// middleware.js
import { NextResponse } from 'next/server'

export function middleware(req) {
  const url = new URL(req.url)
  const path = url.pathname.toLowerCase()

  // Variantes fréquentes de pages "merci"
  const map = new Map([
    ['/merci', '/merci2'],
    ['/success', '/merci2'],
    ['/thank-you', '/merci2'],
    ['/thankyou', '/merci2'],
    ['/payment-success', '/merci2'],
  ])

  const target = map.get(path)
  if (target) {
    const dest = new URL(target + url.search, url.origin)
    return NextResponse.redirect(dest, 308) // 308 = redirection permanente propre
  }

  return NextResponse.next()
}

// (Optionnel) Limite le middleware aux chemins concernés
export const config = {
  matcher: ['/merci', '/success', '/thank-you', '/thankyou', '/payment-success'],
}
