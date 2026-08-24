// ==========================================================================
// COMPONENTE: GESTÃO DEDICADA DE TAGS / ETIQUETAS (CEI/UFRGS)
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

    // 1. Carrega as configurações e a lista de tags do banco
    let settingsData = {};
    let tags = [];
    try {
      if (window.CerneApp?.Api?.fetchSettings) {
        settingsData = (await window.CerneApp.Api.fetchSettings()) || {};
        tags = Array.isArray(settingsData.tags) ? [...settingsData.tags] : [];
      }
    } catch (err) {
      console.error('[TagsPage] Erro ao buscar tags:', err);
    }

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 600px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="tag" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Gestão de Tags de Evidências</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Gerencie os marcadores rápidos salvos no banco do CEI</p>
            </div>
          </div>
          <button class="modal-close" id="tag-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Input para Adicionar Tag -->
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="tag-add-input" class="form-input" placeholder="Nova tag (pressione Enter para adicionar)..." style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.9rem;" />
            <button class="btn btn-primary" id="tag-add-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Adicionar
            </button>
          </div>

          <!-- Nuvem de Tags Editável -->
          <div id="tag-cloud-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px; min-height: 120px; align-content: flex-start;">
            <!-- Renderizado dinamicamente -->
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;">
          <button class="btn btn-secondary" id="tag-cancel-btn" style="padding: 0.5rem 1.25rem;">Cancelar</button>
          <button class="btn btn-primary" id="tag-save-btn" style="padding: 0.5rem 1.5rem;">Salvar Alterações</button>
        </div>

      </div>
    `;

    const cloudContainer = backdrop.querySelector('#tag-cloud-container');
    const input = backdrop.querySelector('#tag-add-input');

    // Renderização dos Badges de Tags
    function renderTags() {
      cloudContainer.innerHTML = '';

      if (tags.length === 0) {
        cloudContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); margin: auto;">Nenhuma tag cadastrada.</p>`;
        return;
      }

      tags.forEach((tag, index) => {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.cssText = 'display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.75rem; background-color: rgba(0, 102, 204, 0.1); color: var(--primary, #0066cc); font-size: 0.85rem; border-radius: 16px; font-weight: 500;';

        badge.innerHTML = `
          # ${tag}
          <i data-lucide="x" class="tag-remove-icon" data-index="${index}" style="width: 14px; height: 14px; cursor: pointer;" title="Remover tag"></i>
        `;

        badge.querySelector('.tag-remove-icon').addEventListener('click', () => {
          tags.splice(index, 1);
          renderTags();
        });

        cloudContainer.appendChild(badge);
      });

      if (window.lucide) lucide.createIcons();
    }

    // Adiciona nova Tag
    function addTag() {
      const val = input.value.trim();
      if (val && !tags.includes(val)) {
        tags.push(val);
        input.value = '';
        renderTags();
      }
    }

    backdrop.querySelector('#tag-add-btn').addEventListener('click', addTag);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    });

    // Salva no Banco via API
    async function saveToDatabase() {
      const filtered = tags.map(t => t.trim()).filter(Boolean);
      try {
        if (window.CerneApp?.Api?.updateSettings) {
          await window.CerneApp.Api.updateSettings({ ...settingsData, tags: filtered });
        }
        closeModal();
      } catch (err) {
        console.error('Erro ao salvar tags:', err);
        alert('Erro ao salvar alterações no banco de dados.');
      }
    }

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#tag-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#tag-cancel-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#tag-save-btn').addEventListener('click', saveToDatabase);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    renderTags();

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.TagsPage = { render: render };
})();