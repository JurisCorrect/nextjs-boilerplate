import dynamic from "next/dynamic";

export const dynamic = "force-dynamic"; // pas de revalidate ici

// Charge le composant client uniquement côté navigateur (pas de SSR)
// -> pas besoin de <Suspense>, pas d’erreur useSearchParams
const Client = dynamic(() => import("./Client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-gray-600">Chargement…</p>
    </div>
  ),
});

export default function Page() {
  return <Client />;
}
