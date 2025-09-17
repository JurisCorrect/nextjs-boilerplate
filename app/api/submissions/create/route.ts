// app/api/submissions/create/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const text: string | null =
      body?.text ?? body?.payload?.text ?? body?.content ?? body?.body ?? null;

    const submissionId = crypto.randomUUID();

    const { error: insErr } = await supabase
      .from("submissions")
      .insert([{ id: submissionId, user_id: auth.user.id }]);
    if (insErr) {
      console.log("[create] insert error:", insErr.message);
      return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    }

    const base =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Lance la génération avec un payload garanti
    fetch(`${base}/api/corrections/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, payload: text ? { text } : null }),
    }).catch(() => {});

    return NextResponse.json({ submissionId }, { status: 200 });
  } catch (e: any) {
    console.log("[create] exception:", e?.message || e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
