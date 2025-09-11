// app/api/debug-urls/route.ts
export const runtime = "nodejs"
export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")
  return Response.json({
    siteUrl,
    successUrl: `${siteUrl}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${siteUrl}/`,
    ts: new Date().toISOString(),
  })
}
