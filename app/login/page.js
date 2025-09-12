export default function LoginPage() {
  return (
    <div dangerouslySetInnerHTML={{
      __html: `
        <main class="page-wrap">
          <h1 class="page-title">CONNEXION / INSCRIPTION</h1>
          
          <div style="display: flex; justify-content: center; margin-bottom: 30px;">
            <button onclick="showLogin()" id="btn-login" style="background: #ffffff; color: #7b1e3a; padding: 12px 24px; border: none; border-radius: 8px 0 0 8px; cursor: pointer; font-weight: 600;">Se connecter</button>
            <button onclick="showRegister()" id="btn-register" style="background: rgba(255,255,255,0.3); color: #ffffff; padding: 12px 24px; border: none; border-radius: 0 8px 8px 0; cursor: pointer; font-weight: 600;">Créer un compte</button>
          </div>

          <section class="panel">
            <!-- FORMULAIRE DE CONNEXION -->
            <div id="login-form">
              <h2 style="color: #ffffff; margin-bottom: 20px; text-align: center;">Connexion</h2>
              <form class="form">
                <div class="field">
                  <label for="login-email">Email</label>
                  <input id="login-email" type="email" class="input" placeholder="votre@email.com" required />
                </div>
                <div class="field">
                  <label for="login-password">Mot de passe</label>
                  <input id="login-password" type="password" class="input" placeholder="Votre mot de passe" required />
                </div>
                <div class="actions">
                  <button type="submit" class="btn-send">SE CONNECTER</button>
                </div>
              </form>
            </div>

            <!-- FORMULAIRE D'INSCRIPTION -->
            <div id="register-form" style="display: none;">
              <h2 style="color: #ffffff; margin-bottom: 20px; text-align: center;">Créer un compte</h2>
              <form class="form">
                <div class="field">
                  <label for="register-email">Email</label>
                  <input id="register-email" type="email" class="input" placeholder="votre@email.com" required />
                </div>
                <div class="field">
                  <label for="register-password">Mot de passe</label>
                  <input id="register-password" type="password" class="input" placeholder="Minimum 8 caractères" required />
                </div>
                <div class="field">
                  <label for="register-confirm">Confirmer le mot de passe</label>
                  <input id="register-confirm" type="password" class="input" placeholder="Retapez votre mot de passe" required />
                </div>
                <div class="actions">
                  <button type="submit" class="btn-send">CRÉER MON COMPTE</button>
                </div>
              </form>
            </div>
          </section>

          <script>
            function showLogin() {
              document.getElementById('login-form').style.display = 'block';
              document.getElementById('register-form').style.display = 'none';
              document.getElementById('btn-login').style.background = '#ffffff';
              document.getElementById('btn-login').style.color = '#7b1e3a';
              document.getElementById('btn-register').style.background = 'rgba(255,255,255,0.3)';
              document.getElementById('btn-register').style.color = '#ffffff';
            }
            
            function showRegister() {
              document.getElementById('login-form').style.display = 'none';
              document.getElementById('register-form').style.display = 'block';
              document.getElementById('btn-register').style.background = '#ffffff';
              document.getElementById('btn-register').style.color = '#7b1e3a';
              document.getElementById('btn-login').style.background = 'rgba(255,255,255,0.3)';
              document.getElementById('btn-login').style.color = '#ffffff';
            }
          </script>
        </main>
      `
    }} />
  )
}
