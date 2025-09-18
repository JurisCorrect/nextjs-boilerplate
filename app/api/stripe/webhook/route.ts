// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquant");

// --- Supabase admin client ---
async function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE service role manquant");
  }
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

export async function POST(req: Request) {
  console.log("=== WEBHOOK POST APPELÉ - DÉBUT ===");
  console.log("WEBHOOK APPELÉ");
  
  try {
    const buf = Buffer.from(await req.arrayBuffer());
    const sig = req.headers.get("stripe-signature") || "";
    
    if (!sig) return new Response("Missing stripe-signature header", { status: 400 });
    if (!STRIPE_WEBHOOK_SECRET) return new Response("Missing STRIPE_WEBHOOK_SECRET env", { status: 400 });

    const event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
    console.log("Événement Stripe validé:", event.type);

    if (event.type === "checkout.session.completed") {
      console.log("Checkout complété détecté");
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      const submissionId = (session.metadata as any)?.submissionId;
      
      console.log("Email:", email, "SubmissionId:", submissionId);
      
      // LOG SEULEMENT - pas d'insertion
      if (email && submissionId) {
        try {
          console.log("🔓 Webhook reçu avec succès");
          console.log("📋 Email:", email);
          console.log("📋 SubmissionId:", submissionId);
          console.log("✅ Données sauvegardées dans les logs uniquement");
          
        } catch (e: any) {
          console.log("⚠️ Exception:", e.message);
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.log("Erreur webhook:", err.message);
    return new Response("Server error", { status: 500 });
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
