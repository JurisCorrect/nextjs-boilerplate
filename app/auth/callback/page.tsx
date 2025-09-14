"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Phase = "loading" | "ready" | "saving" | "done" | "error";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [flowType, setFlowType] = useState<"invite" | "recovery" | "unknown">("unknown");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");

  // Récupère ?code=... ou #code=... (selon la version de Supabase / email)
  const codeFromUrl = useMemo(() => {
    const queryCode = searchParams.get("code");
    if (queryCode) return queryCode;

    // Certains liens Supabase mettent les params dans le hash
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const h = new URLSearchParams(hash);
    return h.get("code");
  }, [searchParams]);

  const typeFromUrl = useMemo(() => {
    const qType = (searchParams.get("type") || "").toLowerCase();
    if (qType === "invite" || qType === "recovery") return qType;

    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const hType = (new URLSearchParams(hash).get("type") || "").toLowerCase();
    if (hType === "invite" || hType === "recovery") return hType;
    return "invite"; // défaut
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        if (!codeFromUrl) {
          setErrorMsg("Lien invalide ou expiré (code manquant).");
          setPhase("error");
          return;
        }

        setFlowType(typeFromUrl as "invite" | "recovery");
        const { error } = await supabase.auth.exchangeCodeForSession(codeFromUrl);

        if (error) {
          setErrorMsg(error.message || "Impossible de valider le lien.");
          setPhase("error");
          return;
        }

        // Auth OK → Afficher le formulaire pour définir le mot de passe
        setPhase("ready");
      } catch (e: any) {
        setErrorMsg(e?.message || "Erreur inconnue.");
        setPhase("error");
      }
    })();
  }, [codeFromUrl, typeFromUrl]);

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
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) {
      setErrorMsg(error.message);
      setPhase("ready");
      return;
    }
    setPhase("done");
    // Redirige où tu veux (dashboard, espace perso, etc.)
    setTimeout(() => router.replace("/"), 1200);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl shadow border border-gray-200 p-6">
        {phase === "loading" && (
          <p className="text-sm text-gray-600">Vérification du lien…</p>
        )}

        {phase === "error" && (
          <div>
            <h1 className="text-xl font-semibold mb-2">Lien invalide</h1>
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {phase === "ready" && (
          <form onSubmit={onSubmit} className="space-y-4">
            <h1 className="text-xl font-semibold">
              {flowType === "recovery" ? "Réinitialiser votre mot de passe" : "Définir votre mot de passe"}
            </h1>

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

        {phase === "done" && (
          <p className="text-sm text-green-700">Mot de passe enregistré. Redirection…</p>
        )}
      </div>
    </div>
  );
}
