export default function LoginPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <main class="page-wrap">
          <h1 class="page-title">CONNEXION</h1>
          <section class="panel">
            <form class="form">
              <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" class="input" placeholder="votre@email.com" required />
              </div>
              <div class="field">
                <label for="password">Mot de passe</label>
                <input id="password" type="password" class="input" placeholder="Votre mot de passe" required />
              </div>
              <div class="actions">
                <button type="submit" class="btn-send">SE CONNECTER</button>
              </div>
            </form>
          </section>
        </main>
      `
    }} />
  )
}
