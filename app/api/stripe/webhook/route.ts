export async function POST(req: Request) {
  console.log("WEBHOOK APPELÉ - VERSION MINIMALE");
  return new Response("ok", { status: 200 });
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
