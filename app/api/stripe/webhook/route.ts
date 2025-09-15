// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { Buffer } from "node:buffer";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// === ENV VARS ===
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// URL de base du site (sans slash final)
const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
  "http://localhost:3000";

// SMTP (utilise tes credentials Vercel)
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "JurisCorrect <no-reply@juriscorrect.com>";
const SMTP_REPLY_TO = process.env.SMTP_REPLY_TO || "marie.terki@icloud.com";

if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquant");

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

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

// --- Email confirmation pour clients existants ---
async function sendPurchaseConfirmationEmailSMTP(to: string) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("SMTP_USER/SMTP_PASS manquants → skip envoi email confirmation");
    return { ok: false, text: "Missing SMTP creds" };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subject = "🎉 Merci pour votre achat chez JurisCorrect";
  const espaceClientUrl = `${SITE_URL}/login`;

  const html = `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6;color:#111">
    <h2 style="margin:0 0 12px">🎉 Merci pour votre achat chez <span style="color:#7b1e3a">JurisCorrect</span></h2>
    <p>📚 Retrouvez toutes vos corrections sur votre espace client !</p>

    <p style="text-align:center;margin:24px 0">
      <a href="${espaceClientUrl}" 
         style="display:inline-block;padding:14px 24px;border-radius:10px;background:#7b1e3a;color:#fff;text-decoration:none;font-weight:700">
        Accéder à mon espace client 🚀
      </a>
    </p>

    <p style="margin:0 0 4px">Bonne correction ! 📝</p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />

    <p style="font-size:14px;color:#555">
      Pour quelconque doute, tu peux me contacter sur 
      <a href="mailto:marie.terki@icloud.com" style="color:#7b1e3a">marie.terki@icloud.com</a>
      ou sur TikTok <strong>Marie Terki</strong> 📱, pour toute question ou autre.
    </p>

    <p style="margin-top:12px">L’équipe JurisCorrect ❤️</p>
  </div>
  `;

  const info = await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
    replyTo: SMTP_REPLY_TO,
  });

  console.log("Email confirmation (client existant) envoyé via SMTP →", to, info.messageId);
  return { ok: true, messageId: info.messageId };
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

        // 1) Essayer d'inviter (nouveau client)
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${SITE_URL}/auth/callback`,
        });

        if (error) {
          // 2) S'il existe déjà → email confirmation + lien recovery (backup/log)
          if (error.message.includes("already") || error.message.includes("exists")) {
            console.log("Utilisateur existe déjà → envoi email confirmation (SMTP) + génération lien recovery (backup).");

            await sendPurchaseConfirmationEmailSMTP(email);

            const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
              type: "recovery",
              email,
              options: { redirectTo: `${SITE_URL}/auth/callback` },
            });
            if (linkErr) {
              console.log("Erreur génération lien recovery:", linkErr.message);
            } else if (linkData?.properties?.action_link) {
              console.log("LIEN RECOVERY CRÉÉ (backup):", linkData.properties.action_link);
            }
          } else {
            console.log("Erreur Supabase:", error.message);
          }
        } else {
          console.log("Invitation envoyée (nouveau client) → email d’invitation géré par Supabase");
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
