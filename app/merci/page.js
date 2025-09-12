export default function MerciPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <main class="page-wrap" style="background: #7b1e3a; min-height: 100vh; color: white; padding: 60px 24px; text-align: center;">
          <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 20px;">Paiement réussi !</h1>
            <p style="font-size: 1.2rem; margin-bottom: 40px; opacity: 0.9;">Merci pour votre achat. Votre paiement a bien été traité.</p>
            
            <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 30px; margin-bottom: 40px;">
              <h2 style="font-size: 1.5rem; margin-bottom: 20px; font-weight: 600;">Que se passe-t-il maintenant ?</h2>
              <div style="text-align: left; line-height: 1.8; font-size: 1.1rem;">
                <p>Vous recevrez un email de confirmation sous peu</p>
                <p>Votre correction sera accessible immédiatement</p>
                <p>En cas de problème, contactez notre support</p>
              </div>
            </div>
            
            <div style="margin-bottom: 40px;">
              <a href="/correction-complete" style="background: white; color: #7b1e3a; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 1.1rem; margin-right: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">Voir la correction</a>
              <a href="/login" style="background: rgba(255,255,255,0.15); color: white; padding: 16px 32px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.3); text-decoration: none; font-weight: 600; font-size: 1.1rem; display: inline-block;">Accéder à votre espace client</a>
            </div>
            
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(255,255,255,0.2);">
              <h3 style="margin: 0 0 10px 0; font-size: 1.2rem; font-weight: 600;">Besoin d'aide ?</h3>
              <p style="margin: 0; opacity: 0.9;">Contactez-nous à <a href="mailto:marie.terki@icloud.com" style="color: white; text-decoration: underline;">marie.terki@icloud.com</a></p>
            </div>
          </div>
        </main>
      `
    }} />
  )
}
