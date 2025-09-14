// app/api/stripe/webhook/route.ts
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`) ||
  'http://localhost:3000'

if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY manquant')

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

async function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE service role manquant')
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  
  // Debug des variables d'environnement
  console.log('[webhook] DEBUG - STRIPE_WEBHOOK_SECRET exists:', !!STRIPE_WEBHOOK_SECRET)
  console.log('[webhook] DEBUG - sig exists:', !!sig)
  
  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }
  
  if (!STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing STRIPE_WEBHOOK_SECRET environment variable', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[webhook] constructEvent error:', err?.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const email =
          session.customer_details?.email ||
          session.customer_email ||
          (typeof session.customer === 'string'
            ? ((await stripe.customers.retrieve(session.customer)) as Stripe.Customer).email || undefined
            : undefined)

        if (!email) {
          console.warn('[webhook] completed sans email, session:', session.id)
          break
        }

        const redirectTo = `${SITE_URL}/login?email_confirmed=1`

        try {
          const supabaseAdmin = await getSupabaseAdmin()
          const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo })

          if (error) {
            const msg = (error as any)?.message || String(error)
            if (/already/i.test(msg)) {
              console.log(`[webhook] ${email} déjà inscrit → pas d'invitation ré-envoyée.`)
            } else {
              console.error('[webhook] inviteUserByEmail error:', msg)
            }
          } else {
            console.log(`[webhook] Invitation envoyée à ${email}`)
          }
        } catch (e) {
          console.error('[webhook] Supabase invite exception:', e)
        }

        break
      }

      default:
        break
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[webhook] handler error:', err)
    return new Response('Server error', { status: 500 })
  }
}
