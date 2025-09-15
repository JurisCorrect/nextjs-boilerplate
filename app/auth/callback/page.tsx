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
        // Vérifier si l'utilisateur est déjà connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Utilisateur déjà connecté, affichage du formulaire");
          setPhase("ready");
          return;
        }

        // Récupérer le code depuis l'URL côté client
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const code = urlParams.get("code") || hashParams.get("code");
        
        if (!code) {
          setErrorMsg("Lien invalide ou expiré (code manquant).");
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
    setErrorMsg(""); // Clear any previous errors
    
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setErrorMsg(error.message);
      setPhase("ready");
      return;
    }
    setPhase("done");
    setTimeout(() => router.replace("/"), 1200);
  }

  const showForm = phase === "ready" || phase === "saving";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl shadow border border-gray-200 p-6">
        {phase === "loading" && <p className="text-sm text-gray-600">Vérification du lien…</p>}

        {phase === "error" && (
          <div>
            <h1 className="text-xl font-semibold mb-2">Lien invalide</h1>
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={onSubmit} className="space-y-4">
            <h1 className="text-xl font-semibold">Définir votre mot de passe</h1>

            <div className="space-y-1">
              <label className="text-sm">Mot de passe</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Confirmer le mot de passe</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <button
              type="submit"
              className="w-full rounded-lg px-4 py-2 border shadow hover:bg-gray-50"
              disabled={phase === "saving"}
            >
              {phase === "saving" ? "Enregistrement…" : "Valider"}
            </button>
          </form>
        )}

        {phase === "done" && <p className="text-sm text-green-700">Mot de passe enregistré. Redirection…</p>}
      </div>
    </div>
  );
}
