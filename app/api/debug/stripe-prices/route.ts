// app/api/debug/stripe-prices/route.ts
export const dynamic = "force-dynamic"
export async function GET() {
  return Response.json({
    one: process.env.NEXT_PUBLIC_STRIPE_PRICE_ONE,
    sub: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUB,
    keyMode: (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_") ? "TEST" : "LIVE",
  })
}
