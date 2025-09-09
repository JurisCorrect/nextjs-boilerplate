// app/api/checkout/route.ts
import Stripe from "stripe";

export const runtime = "nodejs";        // App Router -> exécuter côté serveur
export const dynamic = "force-dynamic"; // évite la mise en cache de la route

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY manquant dans les variables d'environnement.");
}

const stripe = new Stripe(secretKey, {
  apiVersion: "2023-10-16", // aligne-toi avec ta version de typings Stripe
});

type Body = {
  mode: "payment" | "subscription"; // "payment" = one-shot, "subscription" = abo
  submissionId?: string;            // ID de la copie à débloquer (utile en one-shot)
  userId?: string;                  // ton user (id/email supabase par ex.)
  exerciseKind?: "dissertation" | "commentaire" | "cas-pratique";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.mode) {
      return Response.json({ error: "mode manquant (payment|subscription)" }, { status: 400 });
    }

    const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL;
    const priceOne = process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE; // one-shot 5,00 €
    const priceSub = process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB; // abo 12,99 €/mois

    if (!siteUrl)  return Response.json({ error: "NEXT_PUBLIC_SITE_URL manquant" }, { status: 500 });
    if (body.mode === "payment"      && !priceOne) return Response.json({ error: "NEXT_PUBLIC_STRIPE_PRICE_ONE manquant" }, { status: 500 });
    if (body.mode === "subscription" && !priceSub) return Response.json({ error: "NEXT_PUBLIC_STRIPE_PRICE_SUB manquant" }, { status: 500 });

    const success_url = `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url  = `${siteUrl}/`;

    const session = await stripe.checkout.sessions.create({
      mode: body.mode,
      line_items: [{ price: body.mode === "payment" ? priceOne! : priceSub!, quantity: 1 }],
      success_url,
      cancel_url,

      // Pour t'identifier dans le webhook et débloquer/assigner correctement :
      client_reference_id: body.submissionId || undefined,
      metadata: {
        userId: body.userId || "",
        exerciseKind: body.exerciseKind || "",
        productKind: body.mode === "payment" ? "one-shot" : "subscription",
      },
    });

    return Response.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("checkout error:", err);
    return Response.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
