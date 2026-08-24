// ==========================================================================
// COMPONENTE: PÁGINA DE CONFIGURAÇÕES DA CONTA E SISTEMA CEI/UFRGS
// ==========================================================================

(function () {
  function render(onCloseCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 99999 !important;
    `;

    // Carrega preferências e dados do usuário salvos no localStorage ou usa padrões do CEI
    const settings = JSON.parse(localStorage.getItem('cerne:settings') || '{}');
    const userProfile = JSON.parse(localStorage.getItem('cerne:userProfile') || '{}');

    // Dados de perfil do usuário
    const userName = userProfile.name || 'Gestor CEI';
    const userEmail = userProfile.email || 'gestor@cei.ufrgs.br';
    const userRole = userProfile.role || 'Analista de Processos CERNE';

    // Preferências do sistema
    const defaultView = settings.defaultView || 'table';
    const itemsPerPage = settings.itemsPerPage || '10';

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 620px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="settings" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Configurações do Usuário</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Gerencie suas informações pessoais e preferências de exibição</p>
            </div>
          </div>
          <button class="modal-close" id="set-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Seção 1: Dados da Conta do Usuário -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb);">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="user" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
              Perfil da Conta
            </h3>

            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              
              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">Nome de Usuário</label>
                <input type="text" id="set-user-name" class="form-input" value="${userName}" placeholder="Seu nome completo" style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary);" />
              </div>

              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">E-mail Institucional</label>
                <input type="email" id="set-user-email" class="form-input" value="${userEmail}" placeholder="seu.email@ufrgs.br" style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary);" />
              </div>

              <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">Cargo / Função na Incubadora</label>
                <input type="text" id="set-user-role" class="form-input" value="${userRole}" placeholder="Ex: Gestor CERNE, Bolsista, etc." style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary);" />
              </div>

            </div>
          </div>

          <!-- Seção 2: Preferências de Exibição do Sistema -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb);">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="sliders" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
              Preferências do Sistema
            </h3>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Modo de Visualização Padrão</strong>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">Como a lista de evidências é carregada ao abrir o app</span>
                </div>
                <select id="set-view-select" class="form-select" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color);">
                  <option value="table" ${defaultView === 'table' ? 'selected' : ''}>Tabela Detalhada</option>
                  <option value="grid" ${defaultView === 'grid' ? 'selected' : ''}>Grid de Cards</option>
                </select>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Itens por Página</strong>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">Quantidade de registros exibidos na página</span>
                </div>
                <select id="set-per-page-select" class="form-select" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color);">
                  <option value="5" ${itemsPerPage === '5' ? 'selected' : ''}>5 por página</option>
                  <option value="10" ${itemsPerPage === '10' ? 'selected' : ''}>10 por página</option>
                  <option value="20" ${itemsPerPage === '20' ? 'selected' : ''}>20 por página</option>
                  <option value="50" ${itemsPerPage === '50' ? 'selected' : ''}>50 por página</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;">
          <button class="btn btn-secondary" id="set-close-bottom-btn" style="padding: 0.5rem 1.25rem;">Cancelar</button>
          <button class="btn btn-primary" id="set-save-btn" style="padding: 0.5rem 1.5rem;">Salvar Alterações</button>
        </div>

      </div>
    `;

    // Função para Salvar os Dados da Conta e Preferências
    function saveSettings() {
      // 1. Salva os dados de perfil
      const updatedProfile = {
        name: backdrop.querySelector('#set-user-name').value.trim() || 'Gestor CEI',
        email: backdrop.querySelector('#set-user-email').value.trim() || 'gestor@cei.ufrgs.br',
        role: backdrop.querySelector('#set-user-role').value.trim() || 'Analista CEI'
      };
      localStorage.setItem('cerne:userProfile', JSON.stringify(updatedProfile));

      // 2. Salva as preferências da interface
      const newSettings = {
        defaultView: backdrop.querySelector('#set-view-select').value,
        itemsPerPage: backdrop.querySelector('#set-per-page-select').value
      };
      localStorage.setItem('cerne:settings', JSON.stringify(newSettings));

      closeModal();
    }

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#set-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#set-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#set-save-btn').addEventListener('click', saveSettings);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 0);

    return backdrop;
  }

  // Registra no namespace global
  window.CerneApp = window.CerneApp || {};
  window.CerneApp.SettingsPage = { render };
})();