window.CerneApp.SettingsPage = {
  render(settings, onSave, onClose) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal-content settings-modal-width">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Configurações de Filtros</h2>
            <p style="margin-top: 0.35rem; color: var(--text-secondary); font-size: 0.9rem; max-width: 520px;">
              Adicione ou remova as categorias CERNE e as tags que estarão disponíveis nos filtros da tabela.
            </p>
          </div>
          <button class="modal-close" id="settings-close-btn">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <div class="modal-body settings-modal-body">
          <div class="settings-panel">
            <div class="settings-section">
              <div class="settings-section-header">
                <div>
                  <h3>Categoria CERNE</h3>
                  <p>Gerencie as opções visíveis no filtro de categoria.</p>
                </div>
                <button class="btn btn-secondary" id="add-category-btn" type="button">Adicionar categoria</button>
              </div>
              <div id="categories-list" class="settings-list"></div>
            </div>

            <div class="settings-section">
              <div class="settings-section-header">
                <div>
                  <h3>Tags</h3>
                  <p>Gerencie as opções visíveis no filtro de tags.</p>
                </div>
                <button class="btn btn-secondary" id="add-tag-btn" type="button">Adicionar tag</button>
              </div>
              <div id="tags-list" class="settings-list"></div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" id="settings-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="settings-save-btn">Salvar configurações</button>
        </div>
      </div>
    `;

    const categoriesList = overlay.querySelector('#categories-list');
    const tagsList = overlay.querySelector('#tags-list');
    const saveBtn = overlay.querySelector('#settings-save-btn');
    const cancelBtn = overlay.querySelector('#settings-cancel-btn');
    const closeBtn = overlay.querySelector('#settings-close-btn');
    const addCategoryBtn = overlay.querySelector('#add-category-btn');
    const addTagBtn = overlay.querySelector('#add-tag-btn');

    let currentCategories = Array.isArray(settings.categories) ? [...settings.categories] : [];
    let currentTags = Array.isArray(settings.tags) ? [...settings.tags] : [];

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderList(listElement, values, itemType) {
      listElement.innerHTML = '';
      values.forEach((value, index) => {
        const item = document.createElement('div');
        item.className = 'settings-list-item';

        item.innerHTML = `
          <input type="text" class="form-input settings-item-input" value="${escapeHtml(value)}" data-index="${index}" />
          <button class="btn btn-secondary settings-item-remove" type="button" data-index="${index}">
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          </button>
        `;

        const input = item.querySelector('input');
        const removeButton = item.querySelector('.settings-item-remove');

        input.addEventListener('input', (e) => {
          values[index] = e.target.value;
        });

        removeButton.addEventListener('click', () => {
          values.splice(index, 1);
          renderList(listElement, values, itemType);
        });

        listElement.appendChild(item);
      });

      const emptyState = document.createElement('p');
      emptyState.className = 'settings-empty-state';
      if (values.length === 0) {
        emptyState.textContent = itemType === 'category' ? 'Nenhuma categoria configurada ainda.' : 'Nenhuma tag configurada ainda.';
        listElement.appendChild(emptyState);
      }

      lucide.createIcons();
    }

    function refreshLists() {
      renderList(categoriesList, currentCategories, 'category');
      renderList(tagsList, currentTags, 'tag');
    }

    addCategoryBtn.addEventListener('click', () => {
      currentCategories.push('');
      refreshLists();
    });

    addTagBtn.addEventListener('click', () => {
      currentTags.push('');
      refreshLists();
    });

    saveBtn.addEventListener('click', () => {
      const normalizedCategories = currentCategories
        .map((value) => String(value || '').trim())
        .filter((value) => value.length > 0);

      const normalizedTags = currentTags
        .map((value) => String(value || '').trim())
        .filter((value) => value.length > 0);

      onSave({ categories: normalizedCategories, tags: normalizedTags });
    });

    function doClose() {
      overlay.remove();
      if (typeof onClose === 'function') {
        onClose();
      }
    }

    cancelBtn.addEventListener('click', doClose);
    closeBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) doClose();
    });

    refreshLists();

    return overlay;
  }
};
