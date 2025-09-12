export default function InscriptionPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <main class="page-wrap">
          <h1 class="page-title">INSCRIPTION</h1>
          <section class="panel">
            <form class="form">
              <div class="field">
                <label for="email">Email</label>
                <input id="email" type="email" class="input" placeholder="votre@email.com" required />
              </div>
              <div class="field">
                <label for="password">Mot de passe</label>
                <input id="password" type="password" class="input" placeholder="Minimum 8 caractères" required />
              </div>
              <div class="actions">
                <button type="submit" class="btn-send">CRÉER MON COMPTE</button>
              </div>
            </form>
          </section>
        </main>
      `
    }} />
  )
}
