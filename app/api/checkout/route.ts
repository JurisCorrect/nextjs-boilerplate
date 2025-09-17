import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY manquant dans les variables d'environnement")
}

const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" })

type RequestBody = {
  mode?: "payment" | "subscription"
  submissionId?: string
  submission_id?: string    // 👈 compat
  userEmail?: string
  customer_email?: string   // 👈 compat
  exerciseKind?: string
  success_url?: string
  cancel_url?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody

    // 🔄 Normalisation des champs (compat front)
    const submissionId =
      body.submissionId || body.submission_id || null
    const userEmail =
      body.userEmail || body.customer_email || null
    const mode: "payment" | "subscription" = (body.mode as any) || "payment" // 👈 fallback

    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE   // ex: price_...
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB
    const selectedPrice = mode === "payment" ? priceOne : priceSub

    if (!selectedPrice?.startsWith?.("price_")) {
      return new Response(
        JSON.stringify({ error: `Price ID manquant ou invalide pour ${mode}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // URL base fiable
    const site =
      (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
      "http://localhost:3000"

    // ✅ Respecte les URLs envoyées par le front si présentes
    let successUrl = body.success_url || `${site}/merci2?session_id={CHECKOUT_SESSION_ID}`
    let cancelUrl  = body.cancel_url  || `${site}/`

    // ✅ Ajoute submissionId à la successUrl pour la page de retour
    if (submissionId && !/[\?&]submissionId=/.test(successUrl)) {
      const joiner = successUrl.includes("?") ? "&" : "?"
      successUrl = `${successUrl}${joiner}submissionId=${encodeURIComponent(submissionId)}`
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: selectedPrice, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: submissionId || undefined, // 👈 clé pour “retrouver” la soumission
      customer_email: userEmail || undefined,         // 👈 prend en charge customer_email
      payment_method_types: ["card"],
      metadata: {
        exerciseKind: body.exerciseKind ?? "",
        productKind: mode === "payment" ? "one-shot" : "subscription",
        submissionId: submissionId || "",            // 👈 redondance utile côté webhook
      },
    }

    const session = await stripe.checkout.sessions.create(params)
    if (!session.url) throw new Error("Stripe n'a pas retourné d'URL")

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
