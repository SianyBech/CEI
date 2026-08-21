(function () {
  function render(responsaveisList = [], onCloseCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    
    // ESTILOS DE SEGURANÇA: Força o modal a ficar centralizado e por cima de TUDO
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

    const lista = (Array.isArray(responsaveisList) && responsaveisList.length > 0) 
      ? responsaveisList 
      : ['Siany', 'Eduardo', 'Cláudia', 'André', 'Equipe CEI'];

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 550px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--success); display: flex;">
              <i data-lucide="users" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Membros e Responsáveis</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Membros cadastrados no sistema de evidências do CEI</p>
            </div>
          </div>
          <button class="modal-close" id="responsaveis-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Lista de Membros -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${lista.map(nome => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 38px; height: 38px; border-radius: 50%; background-color: var(--primary, #0066cc); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.95rem;">
                    ${nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style="font-size: 0.95rem; color: var(--text-primary); display: block;">${nome}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">Membro da Equipe CEI</span>
                  </div>
                </div>
                <span class="badge" style="background-color: rgba(0, 102, 204, 0.1); color: var(--primary, #0066cc); font-weight: 500; font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: 12px;">
                  Ativo
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
          <button class="btn btn-secondary" id="responsaveis-close-bottom-btn" style="padding: 0.5rem 1.5rem;">Fechar</button>
        </div>

      </div>
    `;

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#responsaveis-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#responsaveis-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.ResponsaveisPage = { render };
})();