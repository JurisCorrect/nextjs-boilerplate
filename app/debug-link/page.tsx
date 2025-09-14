// app/debug-link/page.tsx
"use client";

import { useState } from "react";

export default function DebugLinkPage() {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateLink() {
    if (!email) {
      setError("Veuillez saisir un email");
      return;
    }
    
    setLoading(true);
    setError("");
    setLink("");

    try {
      const response = await fetch("/api/debug-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setLink(data.link);
      } else {
        setError(data.error || "Erreur lors de la génération du lien");
      }
    } catch (e) {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4 p-6 border rounded-lg">
        <h1 className="text-xl font-semibold">Générer un lien de récupération</h1>
        
        <div className="space-y-2">
          <label className="text-sm">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
        </div>

        <button
          onClick={generateLink}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Génération..." : "Générer le lien"}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {link && (
          <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700 text-sm font-semibold">Lien généré :</p>
            <div className="break-all text-xs bg-white p-2 border rounded">
              {link}
            </div>
            <a
              href={link}
              className="inline-block w-full text-center bg-green-600 text-white rounded px-4 py-2"
            >
              Ouvrir le lien
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
