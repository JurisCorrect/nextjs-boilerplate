// app/api/stripe/webhook/route.ts
import Stripe from 'stripe'

// Toujours en Node runtime (pas Edge) et dynamique (pas de cache)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ⛑️ Garde-fous ENV (ne crashe pas au build)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`) ||
  'http://localhost:3000'

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY manquant')
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

// Petit helper pour créer un client admin Supabase uniquement quand nécessaire
async function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE service role manquant (SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL)')
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(req: Request) {
  // 1) Lire le RAW body pour vérifier la signature
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return new Response('Missing stripe-signature or STRIPE_WEBHOOK_SECRET', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // ✅ Récupérer l’email du client payé (fiable)
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          (typeof session.customer === 'string'
            ? ((await stripe.customers.retrieve(session.customer)) as Stripe.Customer).email || undefined
            : undefined)

        // Si pas d’email, on ne peut rien faire -> on log et on sort
        if (!email) {
          console.warn('[webhook] checkout.session.completed sans email')
          break
        }

        // 🔗 Redirection du mail d’invitation vers ta page login (comme ton flow signup)
        const redirectTo = `${SITE_URL}/login?email_confirmed=1`

        // 📨 Envoyer une INVITATION Supabase (l’utilisateur choisira son mdp)
        // - Crée le compte s’il n’existe pas
        // - Envoie l’email “Définir le mot de passe”
        try {
          const supabaseAdmin = await getSupabaseAdmin()
          const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo })
          if (error) {
            // Si l’utilisateur existe déjà, on ignore l’erreur “User already registered”
            const msg = (error as any)?.message || String(error)
            if (!/already/i.test(msg)) {
              console.error('[webhook] inviteUserByEmail error:', error)
            }
          } else {
            console.log('[webhook] Invitation envoyée à', email, '→', data?.user?.id)
          }
        } catch (e) {
          console.error('[webhook] Supabase inviteUserByEmail exception:', e)
        }

        // 💾 Ici tu peux aussi “déverrouiller” l’accès à la correction dans ta DB
        // en t’appuyant sur `session.client_reference_id` ou `session.metadata`.
        // Ex: insert into correction_access(submission_id, email, paid_at)

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // Optionnel : persister l’état d’abonnement Stripe dans ta DB Supabase
        // const sub = event.data.object as Stripe.Subscription
        // ... upsert dans "subscriptions"
        break
      }

      default:
        // autres événements ignorés
        break
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[webhook] handler error:', err)
    return new Response('Server error', { status: 500 })
  }
}
