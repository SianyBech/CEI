window.CerneApp.LoginPage = {
  render(onLogin, onForgotPassword) {
    const container = document.createElement('div');
    container.className = 'login-page';

    container.innerHTML = `
      <div class="login-card">
        <div class="login-brand">
          <div class="login-logo">
            <i data-lucide="brain-circuit" style="width: 26px; height: 26px;"></i>
          </div>
          <div>
            <h1>Gestão de Evidências CERNE</h1>
            <p>Acesse o painel seguro com sua conta do Supabase Auth.</p>
          </div>
        </div>

        <form class="login-form" id="login-form">
          <div class="form-group">
            <label for="login-email">E-mail</label>
            <input id="login-email" name="email" type="email" autocomplete="email" required placeholder="seu.email@empresa.com" />
          </div>

          <div class="form-group">
            <label for="login-password">Senha</label>
            <input id="login-password" name="password" type="password" autocomplete="current-password" required placeholder="Digite sua senha" />
          </div>

          <button class="btn btn-primary login-submit" type="submit" id="login-submit-btn">
            Entrar
          </button>

          <p class="login-link-row">
            <button type="button" class="text-link" id="forgot-password-link">Esqueci minha senha</button>
          </p>

          <div class="login-feedback" id="login-feedback" role="status" aria-live="polite"></div>
        </form>
      </div>
    `;

    const form = container.querySelector('#login-form');
    const submitBtn = container.querySelector('#login-submit-btn');
    const feedback = container.querySelector('#login-feedback');
    const forgotPasswordLink = container.querySelector('#forgot-password-link');

    function setLoading(isLoading) {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
      submitBtn.innerHTML = isLoading
        ? '<span class="btn-loading-spinner" aria-hidden="true"></span> Entrando...'
        : 'Entrar';
    }

    function showFeedback(message, type = 'error') {
      feedback.textContent = message;
      feedback.className = `login-feedback ${type}`;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = form.email.value.trim();
      const password = form.password.value;

      if (!email || !password) {
        showFeedback('Informe e-mail e senha para continuar.');
        return;
      }

      setLoading(true);
      showFeedback('');

      try {
        await onLogin(email, password);
      } catch (error) {
        showFeedback(error?.message || 'Não foi possível entrar. Verifique suas credenciais.');
        setLoading(false);
      }
    });

    forgotPasswordLink.addEventListener('click', async () => {
      const email = form.email.value.trim();
      if (!email) {
        showFeedback('Informe seu e-mail para recuperar a senha.');
        return;
      }

      try {
        await onForgotPassword(email);
        showFeedback('Se a conta existir, um e-mail de recuperação foi enviado.', 'success');
      } catch (error) {
        showFeedback(error?.message || 'Não foi possível iniciar a recuperação de senha.');
      }
    });

    lucide.createIcons();
    return container;
  }
};
