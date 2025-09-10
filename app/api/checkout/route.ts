// app/api/checkout/route.ts
import Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY manquant dans les variables d'environnement")
}

const stripe = new Stripe(secretKey, { 
  apiVersion: "2023-10-16" 
})

type RequestBody = {
  mode: "payment" | "subscription"
  submissionId?: string
  userId?: string
  userEmail?: string
  exerciseKind?: string
}

export async function POST(req: Request) {
  console.log("🔧 API Checkout appelée")
  
  try {
    const body = (await req.json()) as RequestBody
    console.log("📥 Body reçu:", JSON.stringify(body, null, 2))
    
    // Validation du mode
    if (!body?.mode || !["payment", "subscription"].includes(body.mode)) {
      console.log("❌ Mode invalide:", body?.mode)
      return Response.json({ 
        error: "Mode requis: 'payment' ou 'subscription'" 
      }, { status: 400 })
    }

    // Variables d'environnement
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE  // 5€
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB  // 12,99€/mois

    // Debug des variables
    console.log("🔍 Variables d'environnement:")
    console.log("  SITE_URL:", siteUrl)
    console.log("  PRICE_ONE:", priceOne)
    console.log("  PRICE_SUB:", priceSub)
    console.log("  SECRET_KEY:", secretKey?.substring(0, 12) + "..." || "MANQUANT")

    // Validation des variables
    if (!siteUrl) {
      return Response.json({ 
        error: "NEXT_PUBLIC_SITE_URL manquant" 
      }, { status: 500 })
    }
    
    if (body.mode === "payment" && !priceOne) {
      return Response.json({ 
        error: "NEXT_PUBLIC_STRIPE_PRICE_ONE manquant" 
      }, { status: 500 })
    }
    
    if (body.mode === "subscription" && !priceSub) {
      return Response.json({ 
        error: "NEXT_PUBLIC_STRIPE_PRICE_SUB manquant" 
      }, { status: 500 })
    }

    // Sélection du prix
    const selectedPrice = body.mode === "payment" ? priceOne! : priceSub!
    console.log("💰 Prix sélectionné:", selectedPrice)

    // Validation du format Price ID
    if (!selectedPrice.startsWith("price_")) {
      console.log("❌ Format Price ID invalide:", selectedPrice)
      return Response.json({ 
        error: `ID invalide: ${selectedPrice}. Doit commencer par 'price_'` 
      }, { status: 500 })
    }

    // URLs de retour - CHANGÉ VERS LA NOUVELLE PAGE
    const successUrl = `https://nextjs-boilerplate-45ycu87p0-juris-correct.vercel.app/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `https://nextjs-boilerplate-45ycu87p0-juris-correct.vercel.app/`

    console.log("🔗 URLs de retour:")
    console.log("  Success:", successUrl)
    console.log("  Cancel:", cancelUrl)

    // Paramètres de la session Stripe
    const sessionParams = {
      mode: body.mode,
      line_items: [
        {
          price: selectedPrice,
          quantity: 1,
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: body.submissionId || undefined,
      customer_email: body.userEmail, // Email de l'utilisateur connecté
      // Active Apple Pay, Google Pay et PayPal
      payment_method_types: ['card', 'paypal'],
      metadata: {
        userId: body.userId || "",
        userEmail: body.userEmail || "",
        exerciseKind: body.exerciseKind || "",
        productKind: body.mode === "payment" ? "one-shot" : "subscription",
        timestamp: new Date().toISOString(),
      },
    }

    console.log("⚙️ Création session Stripe avec:", JSON.stringify(sessionParams, null, 2))

    // Création de la session Stripe avec méthodes de paiement additionnelles
    const session = await stripe.checkout.sessions.create({
      ...sessionParams,
      // Permet l'affichage automatique des wallets disponibles
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        }
      }
    })
    
    console.log("✅ Session créée:", {
      id: session.id,
      hasUrl: !!session.url,
      mode: session.mode,
    })

    if (!session.url) {
      throw new Error("Stripe n'a pas retourné d'URL de redirection")
    }

    return Response.json({ 
      url: session.url,
      sessionId: session.id 
    }, { status: 200 })

  } catch (error: any) {
    console.error("❌ Erreur API Checkout:")
    console.error("  Message:", error.message)
    console.error("  Type:", error.type || "inconnu")
    console.error("  Code:", error.code || "inconnu")
    console.error("  Stack:", error.stack)

    return Response.json({ 
      error: error.message || "Erreur interne du serveur",
      type: error.type || "unknown_error",
      code: error.code || "unknown_code"
    }, { status: 500 })
  }
}
