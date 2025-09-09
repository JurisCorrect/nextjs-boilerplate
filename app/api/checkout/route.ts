// app/api/checkout/route.ts
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY manquant dans les variables d'environnement.");
}

const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

type Body = {
  mode: "payment" | "subscription";
  // compat : on accepte les deux noms pour l’ID de copie
  submissionId?: string;
  clientReferenceId?: string;

  // opc : infos utiles pour le webhook
  userId?: string;
  exerciseKind?: "dissertation" | "commentaire" | "cas-pratique";
  metadata?: Record<string, string>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.mode) {
      return Response.json({ error: "mode manquant (payment|subscription)" }, { status: 400 });
    }

    const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL;
    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE; // price_...
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB; // price_...

    if (!siteUrl) {
      return Response.json({ error: "NEXT_PUBLIC_SITE_URL manquant" }, { status: 500 });
    }

    // Sélection du price côté serveur (sécurisé)
    const selectedPrice = body.mode === "payment" ? priceOne : priceSub;
    if (!selectedPrice) {
      return Response.json(
        { error: body.mode === "payment"
            ? "NEXT_PUBLIC_STRIPE_PRICE_ONE manquant"
            : "NEXT_PUBLIC_STRIPE_PRICE_SUB manquant" },
        { status: 500 }
      );
    }
    if (!selectedPrice.startsWith("price_")) {
      return Response.json(
        { error: `La variable d'env contient '${selectedPrice}'. Il faut un Price ID qui commence par 'price_' (pas 'prod_')` },
        { status: 500 }
      );
    }

    const success_url = `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${siteUrl}/`;

    // compat: on prend submissionId ou clientReferenceId
    const client_reference_id =
      body.submissionId || body.clientReferenceId || undefined;

    const metadata: Record<string, string> = {
      userId: body.userId || "",
      exerciseKind: body.exerciseKind || "",
      productKind: body.mode === "payment" ? "one-shot" : "subscription",
      ...(body.metadata || {}),
    };

    // petit log de debug : retire-le si tu veux
    console.log("[checkout] mode:", body.mode, "priceId:", selectedPrice, "ref:", client_reference_id);

    const session = await stripe.checkout.sessions.create({
      mode: body.mode,
      line_items: [{ price: selectedPrice, quantity: 1 }], // <- doit être un price_...
      success_url,
      cancel_url,
      client_reference_id,
      metadata,
    });

    return Response.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("checkout error:", err);
    return Response.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
