window.CerneApp.Header = {
  render(onNewEvidenceClick, onSettingsClick, onLogout, user = null) {
    const currentUser = user || window.CerneApp.Auth?.getCurrentUser?.() || null;
    
    // Tenta ler do localStorage o perfil onde foi salva a cor do usuário
    let localProfile = {};
    try {
      localProfile = JSON.parse(localStorage.getItem('cerne:userProfile') || '{}');
    } catch(e) {}

    const userColor = localProfile.cor || currentUser?.user_metadata?.cor || '#0066cc';
    const avatarStyle = `background-color: ${userColor}; color: #ffffff; font-weight: 600;`;

    const role = String(currentUser?.app_metadata?.role || currentUser?.role || currentUser?.user_metadata?.role || 'user').toLowerCase();
    
    const rawName = localProfile.nome || currentUser?.user_metadata?.nome || currentUser?.user_metadata?.full_name;
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
            <div class="user-avatar" style="${avatarStyle}">${firstName.charAt(0).toUpperCase()}</div>
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

     // Função interna para construir e exibir o Modal de Alteração de Senha
    function openChangePasswordModal() {
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal-overlay';
      modalOverlay.id = 'change-password-modal-overlay';

      modalOverlay.innerHTML = `
        <div class="modal-content" style="max-width: 420px;">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="lock" style="width: 20px; height: 20px; color: var(--accent);"></i>
              <h2 class="modal-title">Alterar Senha</h2>
            </div>
            <button class="modal-close" id="pwd-close-btn">
              <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
          </div>

          <div class="modal-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group">
              <label class="form-label" for="pwd-new">Nova Senha</label>
              <input type="password" id="pwd-new" class="form-input" placeholder="Mínimo de 6 caracteres" />
            </div>
            <div class="form-group">
              <label class="form-label" for="pwd-confirm">Confirmar Nova Senha</label>
              <input type="password" id="pwd-confirm" class="form-input" placeholder="Repita a nova senha" />
            </div>
            <div id="pwd-error-msg" style="display: none; color: var(--danger); font-size: 0.825rem;"></div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="pwd-cancel-btn">Cancelar</button>
            <button class="btn btn-primary" id="pwd-save-btn">Salvar Senha</button>
          </div>
        </div>
      `;

      document.body.appendChild(modalOverlay);
      lucide.createIcons({ node: modalOverlay });

      const closeBtn = modalOverlay.querySelector('#pwd-close-btn');
      const cancelBtn = modalOverlay.querySelector('#pwd-cancel-btn');
      const saveBtn = modalOverlay.querySelector('#pwd-save-btn');
      const newPwdInput = modalOverlay.querySelector('#pwd-new');
      const confirmPwdInput = modalOverlay.querySelector('#pwd-confirm');
      const errorMsg = modalOverlay.querySelector('#pwd-error-msg');

      const closeModal = () => modalOverlay.remove();

      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });

      saveBtn.addEventListener('click', async () => {
        const newPwd = newPwdInput.value.trim();
        const confirmPwd = confirmPwdInput.value.trim();

        errorMsg.style.display = 'none';

        if (!newPwd || newPwd.length < 6) {
          errorMsg.textContent = 'A senha deve ter pelo menos 6 caracteres.';
          errorMsg.style.display = 'block';
          return;
        }

        if (newPwd !== confirmPwd) {
          errorMsg.textContent = 'As senhas informadas não coincidem.';
          errorMsg.style.display = 'block';
          return;
        }

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="btn-loading-spinner" aria-hidden="true"></span> Salvando...';

        try {
          await window.CerneApp.Api.changePassword(newPwd);
          alert('Sua senha foi alterada com sucesso!');
          closeModal();
        } catch (err) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Salvar Senha';
          errorMsg.textContent = err.message || 'Erro ao alterar a senha.';
          errorMsg.style.display = 'block';
        }
      });
    } 

    lucide.createIcons();
    return header;
  }
};