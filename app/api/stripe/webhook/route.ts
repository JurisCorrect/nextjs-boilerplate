import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string // SERVICE ROLE (secret, serveur uniquement)
)

export async function POST(req: Request) {
  // Stripe exige le RAW body
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

        const email =
          session.customer_details?.email ||
          (session.customer_email as string | null) ||
          null

        const mode = session.mode // "payment" | "subscription"
        const submissionId =
          (session.client_reference_id as string | undefined) ||
          (session.metadata?.submissionId as string | undefined)

        if (email) {
          // On tente l’invitation systématiquement
          const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?email_confirmed=1`
            : undefined

          const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
              // méta optionnelle
              data: {
                source: "stripe_checkout",
                last_checkout_session: session.id,
                mode,
                submissionId: submissionId || null,
              },
              // TS ne connaît pas redirectTo sur inviteUserByEmail → cast
            } as any
          )

          // Si l'utilisateur existe déjà, Supabase renvoie une erreur “already registered/exists”.
          if (error && !/already|exist/i.test(error.message)) {
            console.error("Invite error:", error.message)
          }

          // (Optionnel) déverrouiller l’accès / tracer l’achat dans ta DB :
          // await supabaseAdmin.from("purchases").insert({
          //   email,
          //   session_id: session.id,
          //   submission_id: submissionId,
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

        // (Optionnel) sync abonnement
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
