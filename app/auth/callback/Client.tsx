"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// --- ENV (typage + garde-fous) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont manquantes."
  );
}
const supabase = createClient(supabaseUrl, supabaseAnon);

export default function CallbackClient() {
  const [phase, setPhase] = useState<"loading" | "ready" | "saving" | "done" | "error">("loading");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Gère ?code=... (OAuth/Invite) et #access_token=... (magic link)
  useEffect(() => {
    (async () => {
      try {
        // 1) Déjà connecté ? (cas lien avec #access_token)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setPhase("ready");
          return;
        }

        // 2) Cas ?code=... → on échange pour une session
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setPhase("ready");
          return;
        }

        // 3) Cas #access_token=... dans le hash (format Supabase)
        const hash = window.location.hash; // #access_token=...&refresh_token=...&type=invite
        if (hash && hash.includes("access_token=")) {
          const params = new URLSearchParams(hash.slice(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token") || "";
          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) throw error;
            if (data?.session) {
              setPhase("ready");
              return;
            }
          }
        }

        setErrorMsg("Lien invalide ou expiré.");
        setPhase("error");
      } catch (e: any) {
        setErrorMsg(e?.message || "Erreur inconnue.");
        setPhase("error");
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    try {
      setPhase("saving");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPhase("done");
    } catch (e: any) {
      setErrorMsg(e?.message || "Impossible de définir le mot de passe.");
      setPhase("error");
    }
  }

  // ======= STYLE (branding JurisCorrect) =======
  const BRAND = "#7b1e3a";
  const BG_GRAD = "linear-gradient(135deg, #7b1e3a 0%, #5c1629 50%, #4a1220 100%)";
  const CARD: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 16,
    padding: "clamp(18px, 2.4vw, 26px)",
    boxShadow: "0 10px 30px rgba(0,0,0,.12)",
    border: "1px solid rgba(0,0,0,.06)"
  };
  const LABEL: React.CSSProperties = { display: "block", color: BRAND, fontWeight: 700, marginBottom: 8 };
  const INPUT: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    outline: "none",
    fontSize: 16
  };
  const BTN = (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    fontWeight: 800,
    background: disabled ? "rgba(123,30,58,.7)" : BRAND,
    color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: "0 12px 30px rgba(123,30,58,.25)"
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG_GRAD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <section style={CARD}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <h1 style={{ color: BRAND, margin: 0, fontWeight: 900 }}>Définir ton mot de passe</h1>
          <p style={{ color: "#666", margin: "6px 0 0" }}>
            Tu es presque prêt·e à accéder à ton espace JurisCorrect ✨
          </p>
        </div>

        {phase === "loading" && (
          <p style={{ textAlign: "center", color: "#666" }}>Chargement…</p>
        )}

        {phase === "error" && (
          <div>
            <p style={{ color: "#dc2626", marginBottom: 12 }}>
              {errorMsg || "Une erreur est survenue."}
            </p>
            <p style={{ color: "#666" }}>
              Réessaie avec le lien le plus récent depuis ton email. Pense à vérifier les
              <strong> courriers indésirables (spam)</strong>.
            </p>
          </div>
        )}

        {phase === "ready" && (
          <form onSubmit={onSubmit}>
            <label style={LABEL}>Nouveau mot de passe</label>
            <input
              type="password"
              placeholder="Au moins 8 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={INPUT}
              onFocus={(e) => (e.currentTarget.style.borderColor = BRAND)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#ddd")}
            />
            {errorMsg && (
              <p style={{ color: "#dc2626", marginTop: 8 }}>{errorMsg}</p>
            )}
            <div style={{ marginTop: 14 }}>
              <button type="submit" style={BTN(phase === "saving")} disabled={phase === "saving"}>
                {phase === "saving" ? "Enregistrement…" : "Définir mon mot de passe 🔐"}
              </button>
            </div>
          </form>
        )}

        {phase === "done" && (
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#059669", marginBottom: 8 }}>Mot de passe défini ✅</h2>
            <p style={{ color: "#555" }}>
              Tu peux maintenant te connecter à ton espace et retrouver tes corrections.
            </p>
            <div style={{ marginTop: 12 }}>
              <a
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  borderRadius: 12,
                  background: BRAND,
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 800
                }}
              >
                Accéder à mon compte 🚀
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
