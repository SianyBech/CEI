// ==========================================================================
// COMPONENTE: PÁGINA DE CONFIGURAÇÕES GERAIS DO SISTEMA CEI/UFRGS
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

    // Carrega preferências salvas do usuário ou define padrões
    const settings = JSON.parse(localStorage.getItem('cerne:settings') || '{}');
    const theme = settings.theme || 'light';
    const defaultView = settings.defaultView || 'table';
    const itemsPerPage = settings.itemsPerPage || '10';
    const notifyUpload = settings.notifyUpload !== false;

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 650px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="settings" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Configurações do Sistema</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Personalize a interface e preferências de uso do CEI</p>
            </div>
          </div>
          <button class="modal-close" id="set-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Seção 1: Aparência e Tema -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb);">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="palette" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
              Aparência do Sistema
            </h3>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Tema de Cores</strong>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">Escolha a aparência visual da plataforma</span>
                </div>
                <select id="set-theme-select" class="form-select" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color);">
                  <option value="light" ${theme === 'light' ? 'selected' : ''}>Claro (Padrão)</option>
                  <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Escuro</option>
                  <option value="system" ${theme === 'system' ? 'selected' : ''}>Seguir Sistema</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Seção 2: Preferências de Exibição de Evidências -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb);">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="layout-grid" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
              Preferências da Listagem
            </h3>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Modo de Visualização Padrão</strong>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">Como as evidências aparecem ao carregar o app</span>
                </div>
                <select id="set-view-select" class="form-select" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color);">
                  <option value="table" ${defaultView === 'table' ? 'selected' : ''}>Tabela Detalhada</option>
                  <option value="grid" ${defaultView === 'grid' ? 'selected' : ''}>Grid de Cards</option>
                </select>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <div>
                  <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Itens por Página</strong>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">Quantidade de registros exibidos na paginação</span>
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

          <!-- Seção 3: Notificações e Comportamento -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb);">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="bell" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
              Notificações e Avisos
            </h3>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Aviso de Upload Concluído</strong>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">Exibir confirmação visual após processamento do OCR/IA</span>
              </div>
              <input type="checkbox" id="set-notify-check" ${notifyUpload ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary, #0066cc);" />
            </div>
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;">
          <button class="btn btn-secondary" id="set-close-bottom-btn" style="padding: 0.5rem 1.25rem;">Cancelar</button>
          <button class="btn btn-primary" id="set-save-btn" style="padding: 0.5rem 1.5rem;">Salvar Preferências</button>
        </div>

      </div>
    `;

    // Função para Salvar as Configurações
    function saveSettings() {
      const newSettings = {
        theme: backdrop.querySelector('#set-theme-select').value,
        defaultView: backdrop.querySelector('#set-view-select').value,
        itemsPerPage: backdrop.querySelector('#set-per-page-select').value,
        notifyUpload: backdrop.querySelector('#set-notify-check').checked
      };

      localStorage.setItem('cerne:settings', JSON.stringify(newSettings));
      
      // Aplica o tema na tag <html> se necessário
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
      }

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