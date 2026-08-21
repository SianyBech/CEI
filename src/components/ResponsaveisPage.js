// ==========================================================================
// COMPONENTE: ABA / PÁGINA DE RESPONSÁVEIS DA EQUIPE CEI
// ==========================================================================

(function () {
  function render(responsaveisList = [], onCloseCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.zIndex = '1100';

    // Se a lista vier vazia, definimos um padrão amigável
    const lista = responsaveisList.length > 0 
      ? responsaveisList 
      : ['Siany', 'Eduardo', 'Cláudia', 'André', 'Equipe CEI'];

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 600px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden;">
        
        <!-- Cabeçalho da Modal -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--success); display: flex;">
              <i data-lucide="users" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Membros e Responsáveis</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Usuários cadastrados na plataforma de evidências do CEI</p>
            </div>
          </div>
          <button class="modal-close" id="responsaveis-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal com a Lista -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${lista.map(nome => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px; transition: border-color 0.2s;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--primary, #0066cc); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem;">
                    ${nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style="font-size: 0.95rem; color: var(--text-primary); display: block;">${nome}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">Membro / Equipe CEI</span>
                  </div>
                </div>
                <span class="badge" style="background-color: rgba(0, 102, 204, 0.1); color: var(--primary, #0066cc); font-weight: 500; font-size: 0.75rem; padding: 0.25rem 0.6rem; border-radius: 12px;">
                  Ativo
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Rodapé da Modal -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
          <button class="btn btn-secondary" id="responsaveis-close-bottom-btn" style="padding: 0.5rem 1.5rem;">Fechar</button>
        </div>

      </div>
    `;

    // Ações de Fechamento
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