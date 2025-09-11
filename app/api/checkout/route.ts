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

// GET TEMPORAIRE: affiche les URLs calculées (pratique pour vérifier en prod)
export async function GET(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? "https"
  const host = req.headers.get("host") ?? ""
  const base = `${proto}://${host}`.replace(/\/$/, "")
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

    // ⚡️ On reconstruit la base directement depuis la requête (aucune ENV requise)
    const proto = req.headers.get("x-forwarded-proto") ?? "https"
    const host = req.headers.get("host") ?? ""
    const base = `${proto}://${host}`.replace(/\/$/, "")

    // Prices depuis ENV (obligatoire) — mais l’URL n’en dépend pas.
    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB
    const selectedPrice = body.mode === "payment" ? priceOne : priceSub
    if (!selectedPrice) {
      return Response.json({ error: `Price ID manquant pour ${body.mode}` }, { status: 500 })
    }
    if (!selectedPrice.startsWith("price_")) {
      return Response.json({ error: `ID invalide: ${selectedPrice}` }, { status: 500 })
    }

    const successUrl = `${base}/merci?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${base}/`

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: body.mode,
      line_items: [{ price: selectedPrice, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: body.submissionId,
      customer_email: body.userEmail,
      payment_method_types: ["card"], // Apple Pay/Google Pay via "Wallets" dans le Dashboard
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
