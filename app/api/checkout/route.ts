// app/api/checkout/route.ts
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) throw new Error("STRIPE_SECRET_KEY manquant")

const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" })

type Body = {
  mode: "payment" | "subscription"
  submissionId?: string
  userId?: string
  exerciseKind?: "dissertation" | "commentaire" | "cas-pratique"
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    if (!body?.mode) return Response.json({ error: "mode manquant" }, { status: 400 })

    const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL
    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE   // price_...
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB   // price_...

    if (!siteUrl)  return Response.json({ error: "NEXT_PUBLIC_SITE_URL manquant" }, { status: 500 })
    if (body.mode === "payment"      && !priceOne) return Response.json({ error: "NEXT_PUBLIC_STRIPE_PRICE_ONE manquant" }, { status: 500 })
    if (body.mode === "subscription" && !priceSub) return Response.json({ error: "NEXT_PUBLIC_STRIPE_PRICE_SUB manquant" }, { status: 500 })

    // Sécurité : ne jamais envoyer un prod_ par erreur
    const chosenPrice = body.mode === "payment" ? priceOne! : priceSub!
    if (!/^price_/.test(chosenPrice)) {
      return Response.json({ error: `Mauvais ID: ${chosenPrice}. Il faut un price_… (pas prod_…)` }, { status: 500 })
    }

    // Logs pour vérifier ce que le serveur lit vraiment
    console.log("[/api/checkout]", {
      mode: body.mode,
      usingPrice: chosenPrice,
      keyMode: secretKey.startsWith("sk_test_") ? "TEST" : "LIVE",
    })

    const session = await stripe.checkout.sessions.create({
      mode: body.mode,
      line_items: [{ price: chosenPrice, quantity: 1 }],
      success_url: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/`,
      client_reference_id: body.submissionId || undefined,
      metadata: {
        userId: body.userId || "",
        exerciseKind: body.exerciseKind || "",
        productKind: body.mode === "payment" ? "one-shot" : "subscription",
      },
      // optionnel :
      // allow_promotion_codes: true,
    })

    return Response.json({ url: session.url }, { status: 200 })
  } catch (err: any) {
    console.error("checkout error:", err)
    return Response.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
