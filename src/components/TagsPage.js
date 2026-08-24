// ==========================================================================
// COMPONENTE: MODAL DE GESTÃO DE TAGS (DADOS DO BANCO)
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

    // 1. Busca as tags reais do banco de dados
    let tagsList = [];
    try {
      if (window.CerneApp?.Api?.fetchTags) {
        tagsList = await window.CerneApp.Api.fetchTags();
      }
    } catch (e) {
      console.error('Erro ao carregar tags do banco:', e);
    }

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 550px; width: 90%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="tag" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Gestão de Tags</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Etiquetas cadastradas no banco do CEI/UFRGS</p>
            </div>
          </div>
          <button class="modal-close" id="tag-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Nuvem de Tags Reais -->
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 1rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px;">
            ${tagsList.length === 0 
              ? '<p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">Nenhuma tag encontrada no banco.</p>'
              : tagsList.map(tag => {
                  const nome = typeof tag === 'object' ? (tag.nome || tag.name || tag.label) : tag;
                  return `
                    <span class="badge" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.75rem; background-color: rgba(0, 102, 204, 0.1); color: var(--primary, #0066cc); font-size: 0.85rem; border-radius: 16px; font-weight: 500;">
                      # ${nome}
                    </span>
                  `;
                }).join('')
            }
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
          <button class="btn btn-secondary" id="tag-close-bottom-btn" style="padding: 0.5rem 1.5rem;">Fechar</button>
        </div>

      </div>
    `;

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#tag-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#tag-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 0);

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.TagsPage = { render };
})();