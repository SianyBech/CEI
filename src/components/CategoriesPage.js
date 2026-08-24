// ==========================================================================
// COMPONENTE: GESTÃO DEDICADA DE CATEGORIAS CERNE (CEI/UFRGS)
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

    // 1. Carrega as configurações e a lista de categorias do banco
    let settingsData = {};
    let categories = [];
    try {
      if (window.CerneApp?.Api?.fetchSettings) {
        settingsData = (await window.CerneApp.Api.fetchSettings()) || {};
        categories = Array.isArray(settingsData.categories) ? [...settingsData.categories] : [];
      }
    } catch (err) {
      console.error('[CategoriesPage] Erro ao buscar categorias:', err);
    }

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 600px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="folder-kanban" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Gestão de Categorias CERNE</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Gerencie as categorias salvas no banco do CEI</p>
            </div>
          </div>
          <button class="modal-close" id="cat-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Form de Adicionar -->
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="cat-add-input" class="form-input" placeholder="Nova categoria (ex: Processo de Seleção)..." style="flex: 1; padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.9rem;" />
            <button class="btn btn-primary" id="cat-add-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Adicionar
            </button>
          </div>

          <!-- Lista Editável de Categorias -->
          <div id="cat-items-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <!-- Renderizado dinamicamente -->
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;">
          <button class="btn btn-secondary" id="cat-cancel-btn" style="padding: 0.5rem 1.25rem;">Cancelar</button>
          <button class="btn btn-primary" id="cat-save-btn" style="padding: 0.5rem 1.5rem;">Salvar Alterações</button>
        </div>

      </div>
    `;

    const listContainer = backdrop.querySelector('#cat-items-list');

    // Função interna para renderizar as linhas de categorias
    function renderList() {
      listContainer.innerHTML = '';

      if (categories.length === 0) {
        listContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; margin: 1rem 0;">Nenhuma categoria salva.</p>`;
        return;
      }

      categories.forEach((cat, index) => {
        const itemRow = document.createElement('div');
        itemRow.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 6px;';

        itemRow.innerHTML = `
          <input type="text" class="form-input cat-item-input" value="${cat}" data-index="${index}" style="flex: 1; padding: 0.35rem 0.6rem; font-size: 0.85rem; border: 1px solid var(--border-color); border-radius: 4px; background: #ffffff;" />
          <button class="cat-delete-btn" data-index="${index}" style="background: none; border: none; color: #ff4757; cursor: pointer; padding: 0.3rem; display: flex; align-items: center;" title="Excluir">
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          </button>
        `;

        // Evento de edição dinâmica do input
        itemRow.querySelector('.cat-item-input').addEventListener('input', (e) => {
          categories[index] = e.target.value;
        });

        // Evento de remoção
        itemRow.querySelector('.cat-delete-btn').addEventListener('click', () => {
          categories.splice(index, 1);
          renderList();
        });

        listContainer.appendChild(itemRow);
      });

      if (window.lucide) lucide.createIcons();
    }

    // Adicionar nova categoria
    backdrop.querySelector('#cat-add-btn').addEventListener('click', () => {
      const input = backdrop.querySelector('#cat-add-input');
      const val = input.value.trim();
      if (val) {
        categories.push(val);
        input.value = '';
        renderList();
      }
    });

    // Salvar no Banco via API
    async function saveToDatabase() {
      const filtered = categories.map(c => c.trim()).filter(Boolean);
      try {
        if (window.CerneApp?.Api?.updateSettings) {
          await window.CerneApp.Api.updateSettings({ ...settingsData, categories: filtered });
        }
        closeModal();
      } catch (err) {
        console.error('Erro ao salvar categorias:', err);
        alert('Erro ao salvar alterações no banco de dados.');
      }
    }

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#cat-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#cat-cancel-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#cat-save-btn').addEventListener('click', saveToDatabase);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    renderList();

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.CategoriesPage = { render: render };
})();