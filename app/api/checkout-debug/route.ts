// app/api/checkout-debug/route.ts
export const runtime = "nodejs"

const PROD_HOST = "nextjs-boilerplate-45ycu87p0-juris-correct.vercel.app"
const PROD_BASE = `https://${PROD_HOST}`

export async function GET() {
  return Response.json({
    base: PROD_BASE,
    successUrl: `${PROD_BASE}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${PROD_BASE}/`,
    ts: new Date().toISOString(),
  })
}
