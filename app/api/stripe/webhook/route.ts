// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature") || "";

  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });
  if (!STRIPE_WEBHOOK_SECRET) return new Response("Missing STRIPE_WEBHOOK_SECRET env", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;

      if (email) {
        const supabaseAdmin = await getSupabaseAdmin();
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${SITE_URL}/auth/callback`,
        });

        if (!error) {
          console.log(`Email envoyé à ${email}`);
        }
      }
    }
    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response("Server error", { status: 500 });
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
