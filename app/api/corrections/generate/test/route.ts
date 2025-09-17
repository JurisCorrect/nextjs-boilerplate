import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const submissionId = crypto.randomUUID();
    const base =
      (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")) ||
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`) ||
      "http://localhost:3000";

    const r = await fetch(`${base}/api/corrections/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        payload: { text: "Texte de test — je veux voir READY." },
      }),
    });
    const json = await r.json().catch(() => ({}));
    return NextResponse.json(
      { called: `${base}/api/corrections/generate`, status: r.status, json, submissionId },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 500 });
  }
}
