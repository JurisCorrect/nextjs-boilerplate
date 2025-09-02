import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const site = process.env.NEXT_PUBLIC_SITE_URL

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  : null

type Pack = 'pack5' | 'pack10' | 'monthly'

export async function POST(req: Request) {
  try {
    if (!stripe) {
      console.error('[CHECKOUT] STRIPE_SECRET_KEY manquant')
      return NextResponse.json(
        { error: 'Stripe mal configuré (clé secrète manquante).' },
        { status: 500 }
      )
    }

    if (!site) {
      console.error('[CHECKOUT] NEXT_PUBLIC_SITE_URL manquant')
      return NextResponse.json(
        { error: 'Site non configuré (NEXT_PUBLIC_SITE_URL).' },
        { status: 500 }
      )
    }

    const { pack, userId }: { pack: Pack; userId?: string } = await req.json()

    // Validation du pack demandé
    if (!pack || !['pack5', 'pack10', 'monthly'].includes(pack)) {
      return NextResponse.json({ error: 'Pack invalide.' }, { status: 400 })
    }

    // Récupération du priceId en fonction du pack
    const priceId =
      pack === 'pack5'
        ? process.env.STRIPE_PRICE_PACK5
        : pack === 'pack10'
        ? process.env.STRIPE_PRICE_PACK10
        : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      console.error('[CHECKOUT] PRICE_ID manquant pour', pack)
      return NextResponse.json(
        { error: `Tarif non configuré pour ${pack}.` },
        { status: 500 }
      )
    }

    const mode: 'payment' | 'subscription' = pack === 'monthly' ? 'subscription' : 'payment'

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      // Stripe créera/associera un client avec l'email saisi si non connecté
      customer_creation: 'always',
      success_url: `${site}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/correction/cancel`,
      metadata: { user_id: userId ?? 'guest', pack },
    })

    if (!session.url) {
      console.error('[CHECKOUT] Session créée sans URL', session)
      return NextResponse.json(
        { error: 'Création de la session Stripe échouée.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[CHECKOUT] Erreur', err)
    return NextResponse.json(
      { error: err?.message ?? 'Erreur inconnue.' },
      { status: 500 }
    )
  }
}
