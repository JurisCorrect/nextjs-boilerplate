import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseServer();
  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.redirect(`${base}/login?next=/api/dev/test-correction`);

  const submissionId = crypto.randomUUID();
  const { error } = await supabase.from("submissions").insert([{ id: submissionId, user_id: auth.user.id }]);
  if (error) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  await fetch(`${base}/api/corrections/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      submissionId,
      payload: { text: "Sujet : La responsabilité administrative pour faute… (démo)" },
    }),
  }).catch(()=>{});

  return NextResponse.redirect(`${base}/correction/${submissionId}`);
}
