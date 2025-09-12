export default function EspaceClientPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <main class="page-wrap">
          <h1 class="page-title">ESPACE CLIENT</h1>
          
          <section class="panel">
            <h2>Mes corrections</h2>
            <div style="margin-bottom: 30px;">
              <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #ffffff;">Dissertation - Droit Civil</h3>
                <p style="margin: 0 0 10px 0; opacity: 0.8; color: #ffffff;">Corrigée le 12 septembre 2025</p>
                <a href="/correction/123" style="background: #ffffff; color: #7b1e3a; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-weight: 600;">Voir la correction</a>
              </div>
            </div>
            
            <h2>Mon abonnement</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
              <p style="color: #ffffff; margin: 0 0 15px 0;">Abonnement mensuel actif - 12,99€/mois</p>
              <p style="color: #ffffff; margin: 0 0 15px 0; opacity: 0.8;">Prochaine facturation : 12 octobre 2025</p>
              <button style="background: transparent; border: 2px solid rgba(255,255,255,0.3); color: #ffffff; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Gérer l'abonnement</button>
            </div>
            
            <div style="text-align: center;">
              <a href="/api/auth/logout" style="color: #ffffff; opacity: 0.8; text-decoration: underline;">Se déconnecter</a>
            </div>
          </section>
        </main>
      `
    }} />
  )
}
