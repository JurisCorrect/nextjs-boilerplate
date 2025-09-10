// app/api/checkout/route.ts
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY manquant dans les variables d'environnement")
}

const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" })

type RequestBody = {
  mode: "payment" | "subscription"
  submissionId?: string
  userId?: string
  userEmail?: string
  exerciseKind?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody

    if (!body?.mode || (body.mode !== "payment" && body.mode !== "subscription")) {
      return Response.json(
        { error: "Mode requis: 'payment' ou 'subscription'" },
        { status: 400 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE  // 5€
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB  // 12,99€/mois

    if (!siteUrl) {
      return Response.json({ error: "NEXT_PUBLIC_SITE_URL manquant" }, { status: 500 })
    }

    const selectedPrice = body.mode === "payment" ? priceOne : priceSub
    if (!selectedPrice) {
      return Response.json(
        { error: `Price ID manquant pour le mode ${body.mode}` },
        { status: 500 }
      )
    }
    if (!selectedPrice.startsWith("price_")) {
      return Response.json(
        { error: `ID invalide: ${selectedPrice}. Doit commencer par 'price_'` },
        { status: 500 }
      )
    }

    // Toujours sans slash final, puis redirige vers /merci
    const base = siteUrl.replace(/\/$/, "")
    const successUrl = `${base}/merci?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${base}/`

    // Tipage strict Stripe
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: body.mode,
      line_items: [{ price: selectedPrice, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: body.submissionId,
      customer_email: body.userEmail,
      // Apple Pay / Google Pay s’affichent avec 'card' si Wallets est activé dans le Dashboard.
      payment_method_types: ["card"],
      metadata: {
        userId: body.userId ?? "",
        userEmail: body.userEmail ?? "",
        exerciseKind: body.exerciseKind ?? "",
        productKind: body.mode === "payment" ? "one-shot" : "subscription",
        timestamp: new Date().toISOString(),
      },
    }

    const session = await stripe.checkout.sessions.create(params)

    if (!session.url) {
      throw new Error("Stripe n'a pas retourné d'URL de redirection")
    }

    return Response.json({ url: session.url, sessionId: session.id }, { status: 200 })
  } catch (error: any) {
    return Response.json(
      {
        error: error?.message || "Erreur interne du serveur",
        type: error?.type || "unknown_error",
        code: error?.code || "unknown_code",
      },
      { status: 500 }
    )
  }
}
