import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});
export async function POST(req: Request) {
  // 1) Lire le RAW body (obligatoire pour vérifier la signature)
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 2) Router les événements utiles
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // mode "payment" (one-shot) OU "subscription"
        // On récupère ce que tu as passé lors de /api/checkout :
        // - session.client_reference_id (ex: submissionId)
        // - session.metadata (ex: userId, typeExo, etc.)
        const mode = session.mode; // "payment" | "subscription"
        const submissionId = session.client_reference_id || session.metadata?.submissionId;
        const userId = session.metadata?.userId || session.customer as string;

        // TODO: déverrouiller l’accès dans ta DB (Supabase)
        // Exemple:
        // - si mode === "payment" → insert dans correction_access(submission_id, user_id, access=true, paid_at=now)
        // - si mode === "subscription" → tu gères la souscription plus bas (created/updated)

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const stripeCustomerId = sub.customer as string;
        const stripeSubscriptionId = sub.id;
        const status = sub.status; // active, trialing, canceled, past_due, etc.
        const currentPeriodEnd = sub.current_period_end; // timestamp

        // TODO: upsert dans ta table subscriptions
        // (stripe_customer_id, stripe_subscription_id, status, current_period_end)
        break;
      }

      default:
        // Autres events : on ignore
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return new Response("Server error", { status: 500 });
  }
}
