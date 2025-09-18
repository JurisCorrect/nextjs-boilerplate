export async function POST(req: Request) {
  console.log("WEBHOOK APPELÉ");
  
  try {
    // Code original existant seulement - sans unlockCorrection
    const buf = Buffer.from(await req.arrayBuffer());
    const sig = req.headers.get("stripe-signature") || "";
    
    if (!sig) return new Response("Missing stripe-signature header", { status: 400 });
    if (!process.env.STRIPE_WEBHOOK_SECRET) return new Response("Missing STRIPE_WEBHOOK_SECRET env", { status: 400 });

    const event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log("Événement Stripe validé:", event.type);

    if (event.type === "checkout.session.completed") {
      console.log("Checkout complété détecté");
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email;
      const submissionId = (session.metadata as any)?.submissionId;
      
      console.log("Email:", email, "SubmissionId:", submissionId);
      // TODO: Ajouter unlockCorrection ici une fois qu'on a identifié l'erreur
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.log("Erreur webhook:", err.message);
    return new Response("Server error", { status: 500 });
  }
}
