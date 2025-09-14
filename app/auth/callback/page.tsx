import NextDynamic from "next/dynamic";

// Config côté server
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Charge le composant client uniquement côté navigateur (CSR)
const Client = NextDynamic(() => import("./Client"), {
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
