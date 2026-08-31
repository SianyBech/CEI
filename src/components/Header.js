window.CerneApp.Header = {
  render(onNewEvidenceClick, onSettingsClick, onLogout, user = null) {
    const currentUser = user || window.CerneApp.Auth?.getCurrentUser?.() || null;
    const role = String(currentUser?.app_metadata?.role || currentUser?.role || currentUser?.user_metadata?.role || 'user').toLowerCase();
    
    const normalizedRole = ['authenticated', 'user', 'member', 'standard'].includes(role)
      ? 'user'
      : (['admin', 'administrator', 'owner'].includes(role) ? 'admin' : role);

    const rawName = currentUser?.user_metadata?.nome || currentUser?.user_metadata?.full_name;
    const displayName = rawName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Usuário');
    
    // Extrai apenas o primeiro nome para a saudação
    const firstName = displayName.trim().split(/\s+/)[0];

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-brand">
        <!-- Container da logo ajustado para fundo cinza clarinho -->
        <div class="header-logo" style="background-color: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center;">
          <img src="/src/logopreta.png" alt="Logo CEI" style="width: 24px; height: 24px; object-fit: contain;" />
        </div>
        <div class="header-title-container">
          <h1 class="header-title">Olá, ${firstName} 👋</h1>
          <span class="header-subtitle">Aqui está o panorama das evidências do CEI.</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary header-primary-btn" id="btn-nova-evidencia">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
          Nova Evidência
        </button>
        <div class="user-menu">
          <button class="user-menu-trigger" id="user-menu-trigger" type="button">
            <div class="user-avatar">${firstName.charAt(0).toUpperCase()}</div>
            <div class="user-menu-summary">
              <strong>${displayName}</strong>
              <span>${currentUser?.email ? currentUser.email : ''}</span>
            </div>
          </button>
          <div class="user-menu-dropdown" id="user-menu-dropdown">
            <button class="user-menu-item" type="button" id="menu-password-btn">
              <i data-lucide="lock" style="width: 16px; height: 16px; color: var(--success);"></i>
              Alterar Senha
            </button>
            <button class="user-menu-item danger" type="button" id="menu-logout-btn">
              <i data-lucide="log-out" style="width: 16px; height: 16px; color: var(--danger);"></i>
              Sair
            </button>
          </div>
        </div>
      </div>
    `;

    header.querySelector('#btn-nova-evidencia').addEventListener('click', onNewEvidenceClick);

    const trigger = header.querySelector('#user-menu-trigger');
    const dropdown = header.querySelector('#user-menu-dropdown');
    const toggleMenu = () => {
      const isOpen = dropdown.classList.contains('open');
      dropdown.classList.toggle('open', !isOpen);
    };

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMenu();
    });

    document.addEventListener('click', () => dropdown.classList.remove('open'));
    dropdown.addEventListener('click', (event) => event.stopPropagation());

    header.querySelector('#menu-logout-btn').addEventListener('click', () => onLogout?.());
    
    header.querySelector('#menu-password-btn').addEventListener('click', () => {
      dropdown.classList.remove('open');
      if (typeof openChangePasswordModal === 'function') {
        openChangePasswordModal();
      }
    });

    lucide.createIcons();
    return header;
  }
};