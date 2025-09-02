// app/api/checkout/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  const { pack, userId }:{ pack:'pack5'|'pack10'|'monthly', userId:string } = await req.json()

  if (!userId) return NextResponse.json({ error:'Non authentifié' }, { status:401 })

  const site = process.env.NEXT_PUBLIC_SITE_URL as string
  const priceId =
    pack === 'pack5' ? process.env.STRIPE_PRICE_PACK5 :
    pack === 'pack10' ? process.env.STRIPE_PRICE_PACK10 :
    process.env.STRIPE_PRICE_MONTHLY

  const mode = pack === 'monthly' ? 'subscription' : 'payment'

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId!, quantity: 1 }],
    success_url: `${site}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/correction/cancel`,
    metadata: { user_id: userId, pack }
  })

  return NextResponse.json({ url: session.url })
}
