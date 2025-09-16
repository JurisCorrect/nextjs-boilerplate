// app/api/stripe/checkout/route.ts
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const DEFAULT_PRICE_ID = process.env.STRIPE_PRICE_ID; // optionnel: fallback
if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquant");

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}` : "http://localhost:3000");

export async function POST(req: Request) {
  try {
    const { priceId, submissionId } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: "submissionId requis" }, { status: 400 });
    }
    const price = priceId || DEFAULT_PRICE_ID;
    if (!price) {
      return NextResponse.json({ error: "priceId requis (ou STRIPE_PRICE_ID en env)" }, { status: 400 });
    }

    // (facultatif) sécuriser: utilisateur connecté
    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],
      // IMPORTANT: renvoyer l'ID de session dans l'URL de succès
      success_url: `${SITE_URL}/merci2?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/clients`,
      customer_email: auth?.user?.email ?? undefined,
      metadata: {
        submission_id: submissionId,
        user_id: auth?.user?.id ?? "",
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    console.log("checkout error:", e?.message || e);
    return NextResponse.json({ error: "stripe_error" }, { status: 500 });
  }
}
