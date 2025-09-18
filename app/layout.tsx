// app/layout.tsx
import "./globals.css";
import FormsPatch from "./_forms-patch";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7b1e3a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://nextjs-boilerplate-juris-correct.vercel.app"),
  title: {
    default: "JurisCorrect",
    template: "%s · JurisCorrect",
  },
  description:
    "Corrections juridiques, suivi personnalisé et méthodologie claire. Accède à ton espace, tes corrections et tes forfaits.",
  applicationName: "JurisCorrect",
  themeColor: "#7b1e3a",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JurisCorrect",
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: "website",
    title: "JurisCorrect",
    description:
      "Corrections juridiques, suivi personnalisé et méthodologie claire.",
    url: "https://nextjs-boilerplate-juris-correct.vercel.app",
    siteName: "JurisCorrect",
  },
  twitter: {
    card: "summary_large_image",
    title: "JurisCorrect",
    description:
      "Corrections juridiques, suivi personnalisé et méthodologie claire.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        // quelques classes/attrs safe pour le rendu mobile
        style={{
          background: "#fff",
          minHeight: "100vh",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* App content */}
        {children}

        {/* Patch DOM pour tes formulaires */}
        <FormsPatch />

        {/* Petit fix iOS : éviter le zoom auto sur <input> < 16px si jamais un style local repasse dessous */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              input, select, textarea, button { font-size: 16px; }
              img, video { max-width: 100%; height: auto; display: block; }
            `,
          }}
        />
        <script
  dangerouslySetInnerHTML={{
    __html: `
      (function () {
        try {
          var isCallback = location.pathname === '/auth/callback';
          var hasOAuthHash = location.hash && location.hash.indexOf('access_token=') !== -1;
          if (!isCallback && hasOAuthHash) {
            // on nettoie le hash pour éviter un détournement vers la page de callback
            history.replaceState(null, '', location.pathname + location.search);
          }
        } catch (e) {}
      })();
    `,
  }}
/>
      </body>
    </html>
  );
}
