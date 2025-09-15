"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Phase = "loading" | "ready" | "saving" | "done" | "error";

export default function Client() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Utilisateur déjà connecté, affichage du formulaire");
          setPhase("ready");
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const code = urlParams.get("code") || hashParams.get("code");
        
        if (!code) {
          setErrorMsg("Lien invalide ou expiré.");
          setPhase("error");
          return;
        }

        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMsg(error.message || "Impossible de valider le lien.");
          setPhase("error");
          return;
        }

        setPhase("ready");
      } catch (e: any) {
        setErrorMsg(e?.message || "Erreur inconnue.");
        setPhase("error");
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (pwd !== pwd2) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    setPhase("saving");
    setErrorMsg("");
    
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setErrorMsg(error.message);
      setPhase("ready");
      return;
    }
    setPhase("done");
    setTimeout(() => router.replace("/espace-client"), 2000);
  }

  const showForm = phase === "ready" || phase === "saving";

  return (
    <main style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px",
        background: "rgba(255,255,255,.08)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: "20px",
        padding: "40px 32px",
        boxShadow: "0 20px 40px rgba(0,0,0,.3)"
      }}>
        {phase === "loading" && (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ 
              color: "#fff", 
              fontSize: "1.5rem", 
              fontWeight: 800, 
              marginBottom: "16px" 
            }}>
              Vérification...
            </h1>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: "0.95rem" }}>
              Validation de votre lien d'invitation
            </p>
          </div>
        )}

        {phase === "error" && (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ 
              color: "#ff6b6b", 
              fontSize: "1.5rem", 
              fontWeight: 800, 
              marginBottom: "16px" 
            }}>
              Lien invalide
            </h1>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: "0.95rem" }}>
              {errorMsg}
            </p>
          </div>
        )}

        {showForm && (
          <>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h1 style={{ 
                color: "#fff", 
                fontSize: "1.8rem", 
                fontWeight: 800, 
                marginBottom: "8px" 
              }}>
                Bienvenue sur JurisCorrect
              </h1>
              <p style={{ color: "rgba(255,255,255,.7)", fontSize: "0.95rem" }}>
                Définissez votre mot de passe pour accéder à votre espace personnel
              </p>
            </div>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  color: "#fff", 
                  fontSize: "0.9rem", 
                  fontWeight: 600, 
                  marginBottom: "8px" 
                }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,.2)",
                    background: "rgba(255,255,255,.1)",
                    color: "#fff",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,.4)";
                    e.target.style.background = "rgba(255,255,255,.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,.2)";
                    e.target.style.background = "rgba(255,255,255,.1)";
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  color: "#fff", 
                  fontSize: "0.9rem", 
                  fontWeight: 600, 
                  marginBottom: "8px" 
                }}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,.2)",
                    background: "rgba(255,255,255,.1)",
                    color: "#fff",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,.4)";
                    e.target.style.background = "rgba(255,255,255,.15)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,.2)";
                    e.target.style.background = "rgba(255,255,255,.1)";
                  }}
                />
              </div>

              {errorMsg && (
                <p style={{ 
                  color: "#ff6b6b", 
                  fontSize: "0.9rem", 
                  textAlign: "center",
                  margin: "0" 
                }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={phase === "saving"}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  borderRadius: "12px",
                  border: "none",
                  background: phase === "saving" 
                    ? "rgba(123,30,58,.5)" 
                    : "linear-gradient(180deg, #7b1e3a 0%, #5c1629 100%)",
                  color: "#fff",
                  fontSize: "1rem",
                  fontWeight: 700,
                  cursor: phase === "saving" ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: phase === "saving" 
                    ? "none" 
                    : "0 8px 20px rgba(123,30,58,.4)",
                }}
                onMouseEnter={(e) => {
                  if (phase !== "saving") {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 12px 25px rgba(123,30,58,.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (phase !== "saving") {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(123,30,58,.4)";
                  }
                }}
              >
                {phase === "saving" ? "Création du compte..." : "Créer mon compte"}
              </button>
            </form>
          </>
        )}

        {phase === "done" && (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ 
              color: "#059669", 
              fontSize: "1.5rem", 
              fontWeight: 800, 
              marginBottom: "16px" 
            }}>
              Compte créé avec succès !
            </h1>
            <p style={{ color: "#666", fontSize: "0.95rem" }}>
              Redirection vers votre espace client...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
