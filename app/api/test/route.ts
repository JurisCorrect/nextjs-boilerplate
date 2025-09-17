// app/api/test/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[test] API test route called - THIS SHOULD APPEAR IN LOGS");
  
  return NextResponse.json({ 
    message: "API route works correctly", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    vercel_url: process.env.VERCEL_URL || "not set"
  });
}
