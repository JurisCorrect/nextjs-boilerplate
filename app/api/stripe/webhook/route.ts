// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// === ENV VARS ===
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
  "http://localhost:3000";

if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquant");

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

// Supabase admin client créé à la demande
async function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE service role manquant");
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: Request) {
  // 1) LIRE LE CORPS EN BRUT (RAW) — indispensable pour la signature Stripe
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature") || "";

  // Debug minimal
  console.log("[webhook] sig présent ?", !!sig);
  console.log("[webhook] secret présent ?", !!STRIPE_WEBHOOK_SECRET);
  if (STRIPE_WEBHOOK_SECRET) {
    console.log("[webhook] whsec prefix:", STRIPE_WEBHOOK_SECRET.slice(0, 7));
  }

  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });
  if (!STRIPE_WEBHOOK_SECRET) return new Response("Missing STRIPE_WEBHOOK_SECRET env", { status: 400 });

  // 2) CONSTRUIRE L'ÉVÉNEMENT SIGNÉ
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("[webhook] constructEvent error:", err?.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 3) TRAITER L'ÉVÉNEMENT
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Tenter de récupérer un email fiable
        const email =
          session.customer_details?.email ||
          session.customer_email ||
          (typeof session.customer === "string"
            ? ((await stripe.customers.retrieve(session.customer)) as Stripe.Customer).email || undefined
            : undefined);

        if (!email) {
          console.warn("[webhook] completed sans email, session:", session.id);
          break;
        }

        // redirection vers une page qui gère exchangeCodeForSession + set password
        const redirectTo = `${SITE_URL}/auth/callback`;

        try {
          const supabaseAdmin = await getSupabaseAdmin();
          
          // Générer un lien de récupération direct
          const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo },
          });

          if (linkErr) {
            console.error("[webhook] generateLink error:", linkErr.message);
          } else if (linkData?.properties?.action_link) {
            console.log("LIEN DIRECT:", linkData.properties.action_link);
            console.log(`Recovery link créé pour ${email}`);
          }
        } catch (e) {
          console.error("[webhook] Exception:", e);
        }

        break;
      }

      default:
        // no-op
        break;
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return new Response("Server error", { status: 500 });
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
