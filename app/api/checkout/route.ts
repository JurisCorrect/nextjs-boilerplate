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

// ⚓️ Ton domaine de production (forcé pour éviter les 404 après paiement)
const PROD_HOST = "nextjs-boilerplate-45ycu87p0-juris-correct.vercel.app"

function getProdBase() {
  return `https://${PROD_HOST}`
}

// Route GET de debug (facultatif mais très utile)
export async function GET() {
  const base = getProdBase()
  return Response.json({
    base,
    successUrl: `${base}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/`,
  })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody
    if (body.mode !== "payment" && body.mode !== "subscription") {
      return Response.json({ error: "Mode requis: 'payment' ou 'subscription'" }, { status: 400 })
    }

    // IDs de prix Stripe depuis l'env (obligatoires)
    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE   // 5€
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB   // 12,99€/mois
    const selectedPrice = body.mode === "payment" ? priceOne : priceSub

    if (!selectedPrice) {
      return Response.json({ error: `Price ID manquant pour ${body.mode}` }, { status: 500 })
    }
    if (!selectedPrice.startsWith("price_")) {
      return Response.json({ error: `ID invalide: ${selectedPrice}` }, { status: 500 })
    }

    // 🔒 On force toujours le domaine de PROD pour la redirection
    const base = getProdBase()
    const successUrl = `${base}/merci?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl  = `${base}/`

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: body.mode,
      line_items: [{ price: selectedPrice, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: body.submissionId,
      customer_email: body.userEmail,
      // Apple Pay / Google Pay s'activent via Dashboard (Wallets). Laisser "card".
      payment_method_types: ["card"],
      metadata: {
        userId: body.userId ?? "",
        userEmail: body.userEmail ?? "",
        exerciseKind: body.exerciseKind ?? "",
        productKind: body.mode === "payment" ? "one-shot" : "subscription",
      },
    }

    const session = await stripe.checkout.sessions.create(params)
    if (!session.url) throw new Error("Stripe n'a pas retourné d'URL")

    return Response.json({ url: session.url, sessionId: session.id }, { status: 200 })
  } catch (e: any) {
    return Response.json({ error: e?.message || "Erreur interne du serveur" }, { status: 500 })
  }
}
