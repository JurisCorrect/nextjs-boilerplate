// app/api/corrections/status/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2023-10-16" 
});

async function getAdmin() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function checkStripePayment(submissionId: string): Promise<boolean> {
  try {
    console.log("🔍 Vérification paiement Stripe pour:", submissionId);
    
    // Chercher les sessions de checkout qui contiennent ce submissionId dans les metadata
    const sessions = await stripe.checkout.sessions.list({
      limit: 100, // Chercher dans les 100 dernières sessions
    });
    
    // Filtrer les sessions qui ont ce submissionId ET qui sont completed
    const matchingSessions = sessions.data.filter(session => {
      const metadata = session.metadata || {};
      const sessionSubmissionId = metadata.submissionId;
      return sessionSubmissionId === submissionId && session.status === 'complete';
    });
    
    console.log("💰 Sessions trouvées pour", submissionId, ":", matchingSessions.length);
    
    return matchingSessions.length > 0;
    
  } catch (error) {
    console.log("⚠️ Erreur vérification Stripe:", error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const submissionId = url.searchParams.get("submissionId");
    
    if (!submissionId) {
      return NextResponse.json({ error: "missing submissionId" }, { status: 400 });
    }

    const supabase = await getAdmin();
    
    // 1. Récupérer la dernière correction
    const { data: corr, error } = await supabase
      .from("corrections")
      .select("id,status,result_json,created_at")
      .eq("submission_id", submissionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
    }

    // 2. Vérifier le paiement directement dans Stripe
    const isUnlocked = await checkStripePayment(submissionId);
    
    console.log("🔓 Résultat vérification:", { submissionId, isUnlocked });

    // 3. Réponse selon l'état de la correction
    if (!corr) {
      return NextResponse.json({
        submissionId,
        status: "none",
        isUnlocked: false
      });
    }

    return NextResponse.json({
      submissionId,
      correctionId: corr.id,
      status: corr.status,
      isUnlocked,
      result: corr.status === "ready" ? corr.result_json : null,
    });
    
  } catch (e: any) {
    console.log("❌ Erreur API status:", e.message);
    return NextResponse.json(
      { error: "server_error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
