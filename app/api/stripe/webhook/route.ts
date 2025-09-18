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
      
      // Insertion simplifiée dans unlocked_corrections
      if (email && submissionId) {
        try {
          console.log("🔓 Déverrouillage simple...");
          const supabaseAdmin = await getSupabaseAdmin();
          console.log("✅ Connexion Supabase OK");
          
          // Insertion directe avec submission_id + email
          console.log("💾 Insertion dans unlocked_corrections:", { submissionId, email });
          const { error: insertError } = await supabaseAdmin
            .from('unlocked_corrections')
            .insert({
              submission_id: submissionId,
              email: email,
              user_id: null // on garde null pour l'instant
            });
          
          if (insertError) {
            console.log("⚠️ Erreur insertion:", insertError.message);
          } else {
            console.log("✅ Correction débloquée avec succès!");
          }
          
        } catch (e: any) {
          console.log("⚠️ Exception déverrouillage:", e.message);
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
