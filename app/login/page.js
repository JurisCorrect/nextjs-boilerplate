export default function LoginPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <main class="page-wrap">
          <h1 class="page-title">CONNEXION</h1>
          <section class="panel">
            <form class="form" method="POST" action="/api/auth/login">
              <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" class="input" placeholder="votre.email@exemple.com" required />
              </div>
              <div class="field">
                <label for="password">Mot de passe</label>
                <input id="password" name="password" type="password" class="input" placeholder="Votre mot de passe" required />
              </div>
              <div class="actions">
                <button type="submit" class="btn-send">SE CONNECTER</button>
              </div>
            </form>
            <p style="text-align: center; margin-top: 20px; color: #ffffff;">
              <a href="/mot-de-passe-oublie" style="color: #ffffff;">Mot de passe oublié ?</a>
            </p>
          </section>
        </main>
      `
    }} />
  )
}
