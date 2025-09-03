// app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

type Pack = 'pack5' | 'pack10' | 'monthly'

const SECRET = process.env.STRIPE_SECRET_KEY
const PRICE_PACK5 = process.env.STRIPE_PRICE_PACK5
const PRICE_PACK10 = process.env.STRIPE_PRICE_PACK10
const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY
const SITE = process.env.NEXT_PUBLIC_SITE_URL

function missingEnv(): string | null {
  if (!SECRET) return 'Stripe mal configuré (clé secrète manquante).'
  if (!PRICE_PACK5) return 'Stripe mal configuré (PRICE_PACK5 manquant).'
  if (!PRICE_PACK10) return 'Stripe mal configuré (PRICE_PACK10 manquant).'
  if (!PRICE_MONTHLY) return 'Stripe mal configuré (PRICE_MONTHLY manquant).'
  return null
}

const stripe = new Stripe(SECRET || '', { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  try {
    const { pack, userId } = (await req.json()) as { pack: Pack; userId?: string }

    const envError = missingEnv()
    if (envError) {
      return NextResponse.json({ error: envError }, { status: 500 })
    }

    const priceId =
      pack === 'pack5' ? PRICE_PACK5 :
      pack === 'pack10' ? PRICE_PACK10 :
      PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json({ error: `Price manquant pour le pack: ${pack}` }, { status: 500 })
    }

    const origin = SITE || req.headers.get('origin') || 'http://localhost:3000'
    const mode: 'payment' | 'subscription' = pack === 'monthly' ? 'subscription' : 'payment'

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/correction/cancel`,
      metadata: {
        user_id: userId ?? 'guest',
        pack,
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      { error: err?.message || 'Erreur de paiement' },
      { status: 500 }
    )
  }
}
