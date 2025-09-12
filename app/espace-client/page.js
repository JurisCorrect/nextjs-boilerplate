export default function EspaceClientPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <main class="page-wrap">
          <h1 class="page-title">ESPACE CLIENT</h1>
          <section class="panel">
            <h2 style="color: #ffffff; margin-bottom: 20px;">Mes corrections</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #ffffff;">Dissertation - Droit Civil</h3>
              <p style="margin: 0 0 15px 0; opacity: 0.8; color: #ffffff;">Corrigée le 12 septembre 2025</p>
              <a href="/correction-complete" style="background: #ffffff; color: #7b1e3a; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">Voir la correction</a>
            </div>
            
            <div style="margin-top: 40px; text-align: center;">
              <a href="/login" style="color: #ffffff; opacity: 0.8; text-decoration: underline;">Se déconnecter</a>
            </div>
          </section>
        </main>
      `
    }} />
  )
}
