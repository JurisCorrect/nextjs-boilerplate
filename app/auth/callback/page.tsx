import NextDynamic from "next/dynamic";

// Config côté server
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BRAND = "#7b1e3a";
const BG_GRAD =
  "linear-gradient(135deg, #7b1e3a 0%, #5c1629 50%, #4a1220 100%)";

// Charge le composant client uniquement côté navigateur (CSR)
const Client = NextDynamic(() => import("./Client"), {
  ssr: false,
  loading: () => (
    <main
      style={{
        minHeight: "100vh",
        background: BG_GRAD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 16,
          padding: "clamp(18px, 2.4vw, 26px)",
          boxShadow: "0 10px 30px rgba(0,0,0,.12)",
          border: "1px solid rgba(0,0,0,.06)",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: BRAND, margin: 0, fontWeight: 900 }}>
          Chargement…
        </h1>
        <p style={{ color: "#666", marginTop: 8 }}>
          Préparation de ton espace JurisCorrect ✨
        </p>
      </section>
    </main>
  ),
});

export default function Page() {
  return <Client />;
}
