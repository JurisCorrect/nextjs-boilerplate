import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"          // pas d'Edge pour Stripe
export const dynamic = "force-dynamic"   // évite la mise en cache

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
})

// Client Supabase admin (Service Role) – côté serveur uniquement
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string // ⚠️ SERVICE ROLE (secret)
)

export async function POST(req: Request) {
  // 1) RAW body obligatoire pour vérifier la signature Stripe
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  if (!sig) return new Response("Missing stripe-signature", { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Email du client côté Stripe (toujours présent si l'email a été saisi)
        const email =
          session.customer_details?.email ||
          (session.customer_email as string | null) ||
          null

        // (Optionnel) ce que tu as passé dans /api/checkout
        const mode = session.mode // "payment" | "subscription"
        const submissionId =
          (session.client_reference_id as string | undefined) ||
          (session.metadata?.submissionId as string | undefined)
        const userIdMeta = session.metadata?.userId as string | undefined

        // === Création/Invitation de l'utilisateur Supabase ===
        if (email) {
          // Déjà un user ?
          const existing = await supabaseAdmin.auth.admin.getUserByEmail(email)

          if (!existing?.data?.user) {
            // Pas de compte → on ENVOIE une invitation "définir le mot de passe"
            // Lien de redirection après set-password (facultatif)
            const redirectTo =
              (process.env.NEXT_PUBLIC_SITE_URL
                ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?email_confirmed=1`
                : undefined)

            await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
              data: {
                source: "stripe_checkout",
                last_checkout_session: session.id,
                mode,
                submissionId: submissionId || null,
              },
              // @ts-ignore - redirectTo est supporté par Supabase
              redirectTo,
            })
          }

          // (Optionnel) persister l’achat / déverrouiller l’accès
          // Exemple :
          // await supabaseAdmin.from("correction_access").insert({
          //   email,
          //   session_id: session.id,
          //   submission_id: submissionId,
          //   access: true,
          //   paid_at: new Date().toISOString(),
          // })
        }

        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const stripeCustomerId = sub.customer as string
        const stripeSubscriptionId = sub.id
        const status = sub.status
        const currentPeriodEnd = sub.current_period_end

        // (Optionnel) synchroniser l'abonnement dans ta DB
        // await supabaseAdmin.from("subscriptions").upsert({
        //   stripe_customer_id: stripeCustomerId,
        //   stripe_subscription_id: stripeSubscriptionId,
        //   status,
        //   current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        // })
        break
      }

      default:
        // autres events ignorés
        break
    }

    return new Response("ok", { status: 200 })
  } catch (err: any) {
    console.error("Webhook handler error:", err)
    return new Response("Server error", { status: 500 })
  }
}
