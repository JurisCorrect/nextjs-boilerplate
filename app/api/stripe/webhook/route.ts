// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ⚠️ Vérifie bien l’URL de ton site
const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
  "http://localhost:3000";

// ✅ Resend sans dépendance: via fetch (pas d'import "resend")
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "JurisCorrect <no-reply@juriscorrect.com>";

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

// ------------------------
// Email confirmation (clients existants) via Resend HTTP API
// ------------------------
async function sendPurchaseConfirmationEmail(to: string) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY manquant → skip envoi email (confirmation client existant)");
    return { ok: false, status: 0, text: "RESEND_API_KEY missing" };
  }

  const subject = "🎉 Merci pour votre achat chez JurisCorrect";
  const espaceClientUrl = `${SITE_URL}/login`;

  const html = `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6;color:#111">
    <h2 style="margin:0 0 12px">🎉 Merci pour votre achat chez <span style="color:#7b1e3a">JurisCorrect</span></h2>
    <p>🧾 Votre paiement a bien été confirmé.</p>
    <p>📚 Retrouve toutes tes corrections et ton forfait depuis ton espace client. Tu peux aussi consulter tes anciennes corrections et suivre ta progression.</p>

    <p style="text-align:center;margin:28px 0">
      <a href="${espaceClientUrl}" style="display:inline-block;padding:14px 24px;border-radius:10px;background:#7b1e3a;color:#fff;text-decoration:none;font-weight:700">
        Accéder à mon espace client 🚀
      </a>
    </p>

    <p>🌐 Découvre aussi notre site : <a href="${SITE_URL}" style="color:#7b1e3a;text-decoration:underline">${SITE_URL.replace(/^https?:\/\//,'')}</a> ✨</p>

    <p>Bonne correction ! 📝</p>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />

    <p style="font-size:14px;color:#555">
      Une question, un doute ? Écris-moi 👉 
      <a href="mailto:marie.terki@icloud.com" style="color:#7b1e3a">marie.terki@icloud.com</a> 
      ou sur TikTok <strong>Marie Terki</strong> 📱
    </p>

    <p style="margin-top:12px">L’équipe JurisCorrect ❤️</p>
  </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.log("Resend error:", res.status, text);
    return { ok: false, status: res.status, text };
  }
  console.log("Email confirmation envoyé via Resend →", to);
  return { ok: true, status: res.status, text };
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

        // 1) On tente l'invitation (nouveau client)
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${SITE_URL}/auth/callback`,
        });

        if (error) {
          // Utilisateur existe probablement déjà
          if (error.message.includes("already") || error.message.includes("exists")) {
            console.log("Utilisateur existe déjà → envoi email confirmation (Resend) + génération lien recovery (backup)");

            // 2) Envoi email confirmation "friendly" (client existant)
            await sendPurchaseConfirmationEmail(email);

            // 3) Backup: générer un lien recovery (pour les logs/support, pas envoyé au client)
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
          console.log("Invitation envoyée (nouveau client) → Supabase gère l'email d'invitation");
          // L’email d’invitation (création de mot de passe) part via Supabase (template à personnaliser dans le dashboard)
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
