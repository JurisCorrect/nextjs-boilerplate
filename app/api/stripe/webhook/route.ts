import Stripe from "stripe"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
})

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)")
  }
  return createClient(url, key)
}

export async function POST(req: Request) {
  // Stripe veut le RAW body
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

        const mode = session.mode
        const submissionId =
          (session.client_reference_id as string | undefined) ||
          (session.metadata?.submissionId as string | undefined)

        if (email) {
          // ⚠️ Instanciation Supabase ici (pas au top-level)
          const supabaseAdmin = getAdminClient()

          // On tente l’invitation même si le compte existe déjà
          const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?email_confirmed=1`
            : undefined

          const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
              data: {
                source: "stripe_checkout",
                last_checkout_session: session.id,
                mode,
                submissionId: submissionId || null,
              },
              // @ts-ignore : redirectTo est accepté par Supabase
              redirectTo,
            } as any
          )

          // Si déjà inscrit, Supabase renvoie “already registered/exists” → on ignore.
          if (error && !/already|exist/i.test(error.message)) {
            console.error("Invite error:", error.message)
          }

          // (Optionnel) Persister l’achat / déverrouiller l’accès
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
        // const supabaseAdmin = getAdminClient()
        // await supabaseAdmin.from("subscriptions").upsert({ ... })
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
