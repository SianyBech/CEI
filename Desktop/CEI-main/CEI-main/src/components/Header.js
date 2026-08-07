window.CerneApp.Header = {
  render(onNewEvidenceClick, onSettingsClick, onLogout, user = null) {
    const currentUser = user || window.CerneApp.Auth?.getCurrentUser?.() || null;
    const role = String(currentUser?.app_metadata?.role || currentUser?.role || currentUser?.user_metadata?.role || 'user').toLowerCase();
    
    // Normalize role to check for settings permission (both admin and user have access to settings)
    const normalizedRole = ['authenticated', 'user', 'member', 'standard'].includes(role)
      ? 'user'
      : (['admin', 'administrator', 'owner'].includes(role) ? 'admin' : role);
    const canManageSettings = ['admin', 'user'].includes(normalizedRole);
    const displayName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Usuário';
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-brand">
        <div class="header-logo">
          <i data-lucide="brain-circuit" style="width: 20px; height: 20px; color: var(--success);"></i>
        </div>
        <div class="header-title-container">
          <span class="header-brand-label">CERNE</span>
          <h1 class="header-title">Olá, ${displayName} 👋</h1>
          <span class="header-subtitle">Aqui está o panorama das evidências do CERNE.</span>
        </div>
      </div>
      <div class="header-actions">
        ${canManageSettings ? `<button class="btn btn-secondary" id="btn-settings">
          <i data-lucide="settings" style="width: 16px; height: 16px; color: var(--success);"></i>
          Configurações
        </button>` : ''}
        <button class="btn btn-primary header-primary-btn" id="btn-nova-evidencia">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
          Nova Evidência
        </button>
        <div class="user-menu">
          <button class="user-menu-trigger" id="user-menu-trigger" type="button">
            <div class="user-avatar">${(currentUser?.user_metadata?.full_name || currentUser?.email || 'U').charAt(0).toUpperCase()}</div>
            <div class="user-menu-summary">
              <strong>${displayName}</strong>
              <span>${currentUser?.email ? currentUser.email : ''}</span>
            </div>
          </button>
          <div class="user-menu-dropdown" id="user-menu-dropdown">
            <button class="user-menu-item" type="button" id="menu-profile-btn">
              <i data-lucide="user" style="width: 16px; height: 16px; color: var(--success);"></i>
              Meu Perfil
            </button>
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
    const settingsButton = header.querySelector('#btn-settings');
    if (settingsButton) {
      settingsButton.addEventListener('click', onSettingsClick);
    }

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
    header.querySelector('#menu-profile-btn').addEventListener('click', () => {
      dropdown.classList.remove('open');
      window.alert('O perfil completo será integrado ao painel do Supabase Auth em uma próxima etapa.');
    });
    header.querySelector('#menu-password-btn').addEventListener('click', () => {
      dropdown.classList.remove('open');
      window.alert('A recuperação de senha já está disponível na tela de login.');
    });

    lucide.createIcons();
    return header;
  }
};
