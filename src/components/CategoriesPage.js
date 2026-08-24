// ==========================================================================
// COMPONENTE: MODAL DE GESTÃO DE CATEGORIAS (DADOS DO BANCO)
// ==========================================================================

(function () {
  async function render(onCloseCallback) {
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

    // 1. Busca as categorias reais do banco de dados
    let categoriesList = [];
    try {
      if (window.CerneApp?.Api?.fetchCategories) {
        categoriesList = await window.CerneApp.Api.fetchCategories();
      }
    } catch (e) {
      console.error('Erro ao carregar categorias do banco:', e);
    }

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 550px; width: 90%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="folder-kanban" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Gestão de Categorias</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Categorias cadastradas no banco do CEI/UFRGS</p>
            </div>
          </div>
          <button class="modal-close" id="cat-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Lista de Categorias Reais -->
          <div id="cat-list-container" style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${categoriesList.length === 0 
              ? '<p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; margin: 1rem 0;">Nenhuma categoria encontrada no banco.</p>'
              : categoriesList.map(cat => {
                  const nome = typeof cat === 'object' ? (cat.nome || cat.name || cat.label) : cat;
                  return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 6px;">
                      <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-primary);">${nome}</span>
                      <span class="badge" style="font-size: 0.75rem; background: rgba(0, 102, 204, 0.1); color: var(--primary, #0066cc); padding: 0.2rem 0.6rem; border-radius: 12px;">Ativa</span>
                    </div>
                  `;
                }).join('')
            }
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
          <button class="btn btn-secondary" id="cat-close-bottom-btn" style="padding: 0.5rem 1.5rem;">Fechar</button>
        </div>

      </div>
    `;

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#cat-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#cat-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 0);

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.CategoriesPage = { render };
})();