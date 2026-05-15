<!DOCTYPE html>
<html lang="fr">

<head>
  <title>Login</title>
  <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>

<body>

  <!-- Animated background blobs -->
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="bg-blob blob-3"></div>

  <div class="login-wrapper">

    <!-- Card -->
    <div class="login-card">

      <!-- Logo / Brand -->
      <div class="brand">
        <img
          src="${url.resourcesPath}/public/finansia-logo.png"
          alt="Finansia Logo"
          class="brand-logo"
        />
      </div>

      <h1 class="login-title">Client Dashboard</h1>
      <p class="login-sub">Connectez-vous à votre espace de travail</p>

      <#if message?has_content>
        <div class="alert alert-${message.type}">
          <span class="alert-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
          <span class="alert-text">${message.summary?no_esc}</span>
        </div>
      </#if>

      <!-- Form -->
      <form action="${url.loginAction}" method="post" class="login-form">

        <div class="field-group">
          <div class="field-wrap">
            <span class="field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="username"
              name="username"
              type="text"
              class="field-input"
              placeholder="Login"
              autocomplete="username"
              autofocus
            />
          </div>
        </div>

        <div class="field-group">
          <div class="field-wrap">
            <span class="field-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <input
              id="password"
              name="password"
              type="password"
              class="field-input"
              placeholder="Mot de passe"
              autocomplete="current-password"
            />
            <button type="button" class="toggle-pw" aria-label="Afficher le mot de passe" onclick="togglePassword()">
              <svg id="eye-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg id="eye-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input type="checkbox" name="rememberMe" />
            <span class="checkmark"></span>
            Se souvenir de moi
          </label>
          <a href="#" class="forgot-link">Mot de passe oublié ?</a>
        </div>

        <button type="submit" class="btn-submit">
          <span>Se connecter</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

      </form>

  <script>
    function togglePassword() {
      var input   = document.getElementById('password');
      var eyeOpen = document.getElementById('eye-open');
      var eyeClosed = document.getElementById('eye-closed');
      var isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      eyeOpen.style.display   = isHidden ? 'none'  : '';
      eyeClosed.style.display = isHidden ? ''      : 'none';
    }
  </script>

</body>
</html>