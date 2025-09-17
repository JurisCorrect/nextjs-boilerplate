// app/api/test/route.ts
export async function GET() {
  console.log("[test] API test route called");
  return Response.json({ message: "API works", timestamp: new Date().toISOString() });
}
