export async function POST(req: Request) {
  console.log("🔍 [GENERATE] Diagnostic variables env");
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("Clé présente:", !!apiKey);
  console.log("Longueur clé:", apiKey?.length || 0);
  console.log("Commence par sk-:", apiKey?.startsWith('sk-') || false);
  
  // Liste toutes les variables qui commencent par OPENAI
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('OPENAI')) {
      console.log(`Variable ${key}:`, !!process.env[key]);
    }
  });
  
  if (!apiKey) {
    return NextResponse.json({ error: "openai_key_missing" }, { status: 500 });
  }
  
  return NextResponse.json({ ok: true, keyStatus: "present" });
}
