import "./globals.css";
import FormsPatch from "./_forms-patch"; // <— AJOUT

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <FormsPatch /> {/* <— AJOUT : patch DOM pages d’envoi seulement */}
      </body>
    </html>
  );
}
