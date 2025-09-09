// app/test-pay/page.tsx
"use client";
import { useState } from "react";

export default function TestPayPage() {
  const [loading, setLoading] = useState<"one"|"sub"|null>(null);
  const go = async (mode: "payment" | "subscription") => {
    setLoading(mode === "payment" ? "one" : "sub");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          submissionId: mode === "payment" ? "demo-correction-123" : undefined,
          userId: "demo-user-42",
          exerciseKind: "dissertation",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur inconnue");
      window.location.href = data.url;
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Test paiements Stripe</h1>
      <p>Utilise la carte test <b>4242 4242 4242 4242</b>, date future, CVC 123.</p>
      <button
        onClick={() => go("payment")}
        disabled={loading !== null}
        style={{ display:"block", width:"100%", padding:"14px 18px", margin:"12px 0", borderRadius:12, border:"none", background:"#6B2737", color:"#fff", fontWeight:800 }}
      >
        {loading === "one" ? "Ouverture…" : "Payer correction unique (5 €)"}
      </button>
      <button
        onClick={() => go("subscription")}
        disabled={loading !== null}
        style={{ display:"block", width:"100%", padding:"14px 18px", margin:"12px 0", borderRadius:12, border:"none", background:"#6B2737", color:"#fff", fontWeight:800 }}
      >
        {loading === "sub" ? "Ouverture…" : "S’abonner (12,99 €/mois)"}
      </button>
    </main>
  );
}
