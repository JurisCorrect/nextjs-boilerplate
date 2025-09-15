// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Email SMTP config
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM;

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

// Fonction pour envoyer un email de confirmation d'achat
async function sendPurchaseConfirmationEmail(email: string) {
  if (!RESEND_API_KEY || !RESEND_FROM) {
    console.log("[webhook] Pas de config Resend, email non envoyé");
    return false;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);
    
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to: email,
      subject: "Merci pour votre achat chez JurisCorrect",
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#7b1e3a;margin-bottom:20px">Merci pour votre achat chez JurisCorrect</h2>
          
          <p style="font-size:16px;margin-bottom:25px">Retrouvez toutes vos corrections sur votre espace client !</p>
          
          <p style="text-align:center;margin:30px 0">
            <a href="${SITE_URL}/espace-client" 
               style="display:inline-block;padding:14px 28px;background:#7b1e3a;color:white;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">
              Accéder à mon espace client
            </a>
          </p>
          
          <p style="margin-top:30px;color:#666;font-size:14px">
            Besoin d'aide ? Contactez-nous : <a href="mailto:marie.terki@icloud.com" style="color:#7b1e3a">marie.terki@icloud.com</a>
          </p>
        </div>
      `
    });

    if (error) {
      console.error("[webhook] Erreur envoi email confirmation:", error);
      return false;
    }
    
    console.log(`[webhook] Email de confirmation envoyé à ${email}`);
    return true;
  } catch (e: any) {
    console.error("[webhook] Exception envoi email:", e.message);
    return false;
  }
}

export async function POST(req: Request) {
  console.log("WEBHOOK APPELÉ");
  
  const buf = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("stripe-signature") || "";

  if (!sig) return new Response("Missing stripe-signature header", { status: 400 });
  if (!STRIPE_WEBHOOK_SECRET) return new Response("Missing STRIPE_WEBHOOK_SECRET env", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
    console.log("Événement Stripe validé:", event.type);
  } catch (err: any) {
    console.log("Erreur signature:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      console.log("Checkout complété détecté");
      
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      
      console.log("Email trouvé:", email);
      
      if (email) {
        const supabaseAdmin = await getSupabaseAdmin();
        
        // Essayer d'inviter l'utilisateur (nouveau client)
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${SITE_URL}/auth/callback`,
        });

        if (error) {
          if (error.message.includes("already") || error.message.includes("exists")) {
            console.log("Client existant détecté - envoi email de confirmation d'achat");
            
            // Client existant : envoyer email de confirmation d'achat
            const emailSent = await sendPurchaseConfirmationEmail(email);
            
            if (emailSent) {
              console.log("✅ EMAIL DE CONFIRMATION ENVOYÉ À CLIENT EXISTANT:", email);
            } else {
              console.log("⚠️ Échec envoi email confirmation, génération lien recovery");
              
              // Fallback : générer un lien recovery
              const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                type: "recovery",
                email,
                options: { redirectTo: `${SITE_URL}/auth/callback` },
              });

              if (linkData?.properties?.action_link) {
                console.log("LIEN RECOVERY BACKUP:", linkData.properties.action_link);
              }
            }
          } else {
            console.log("Erreur Supabase:", error.message);
          }
        } else {
          console.log("✅ EMAIL INVITATION ENVOYÉ À NOUVEAU CLIENT:", email);
        }
      } else {
        console.log("Pas d'email dans la session");
      }
    } else {
      console.log("Événement ignoré:", event.type);
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
