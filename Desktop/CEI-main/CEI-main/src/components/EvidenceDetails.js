window.CerneApp.EvidenceDetails = {
  render(evidence, onClose, onSave, categories = [], tagsList = []) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'details-modal-overlay';

    // Match CERNE category badge color
    const categoryClass = `badge-${evidence.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

    // Determine file icon
    let iconName = 'file';
    let iconClass = 'file-icon-documento';
    if (evidence.tipo === 'pdf') {
      iconName = 'file-text';
      iconClass = 'file-icon-pdf';
    } else if (evidence.tipo === 'imagem') {
      iconName = 'image';
      iconClass = 'file-icon-imagem';
    }

    // Generate tags HTML for preview
    const tagsHTML = (evidence.tags || [])
      .map(tag => `<span class="tag">${tag}</span>`)
      .join(' ');

    const titleText = evidence.titulo || evidence.nome;

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function buildCategoryOptions(selectedCategory) {
      let html = '';
      let hasSelected = false;
      const cats = Array.isArray(categories) ? categories : [];
      cats.forEach(cat => {
        const isSel = (cat === selectedCategory);
        if (isSel) hasSelected = true;
        html += `<option value="${escapeHtml(cat)}" ${isSel ? 'selected' : ''}>${escapeHtml(cat)}</option>`;
      });
      if (!hasSelected && selectedCategory) {
        html = `<option value="${escapeHtml(selectedCategory)}" selected>${escapeHtml(selectedCategory)}</option>` + html;
      }
      return html;
    }

    overlay.innerHTML = `
      <div class="modal-content detail-modal-width">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <i data-lucide="${iconName}" class="file-icon ${iconClass}"></i>
            <h2 class="modal-title" style="font-size: 1.1rem; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(titleText)}">
              ${escapeHtml(titleText)}
            </h2>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            
            <button class="modal-close" id="details-close-btn">
              <i data-lucide="x" style="width: 20px; height: 20px;"></i>
            </button>
          </div>
        </div>

        <div class="modal-body" style="padding: 1.5rem;">
          <div class="details-grid">
            
            <!-- Left Panel: Editable Metadata -->
            <div class="details-sidebar">
              <div class="detail-item">
                <label class="detail-label" for="detail-title-input">Título da Evidência</label>
                <input id="detail-title-input" class="form-input" value="${escapeHtml(titleText)}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-file-name">Arquivo Original</label>
                <input id="detail-file-name" class="form-input" value="${escapeHtml(evidence.nome)}" disabled style="background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-evento-input">Evento de Origem</label>
                <input id="detail-evento-input" class="form-input" value="${escapeHtml(evidence.evento)}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-categoria-select">Categoria CERNE</label>
                <select id="detail-categoria-select" class="form-select">
                  ${buildCategoryOptions(evidence.categoria)}
                </select>
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-responsavel-input">Responsável pelo Envio</label>
                <input id="detail-responsavel-input" class="form-input" value="${escapeHtml(evidence.responsavel)}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-data-input">Data do Registro</label>
                <input id="detail-data-input" class="form-input" value="${escapeHtml(evidence.data)}" />
              </div>

              <div class="detail-item">
                <label class="detail-label">Tags da Evidência</label>
                <div class="tags-selector-wrapper">
                  <div class="selected-tags-display" id="detail-selected-tags-display">
                    <!-- selected tags will be dynamically generated as pills -->
                  </div>
                  <select class="form-select" id="detail-add-tag-select" style="margin-top: 0.35rem;">
                    <!-- dynamically populated option list -->
                  </select>
                </div>
              </div>

              <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="#" class="btn btn-secondary" id="btn-download-original" style="width: 100%; text-decoration: none;">
                  <i data-lucide="download" style="width: 15px; height: 15px;"></i>
                  Baixar Arquivo
                </a>
                <button class="btn btn-secondary" id="btn-preview-original" style="width: 100%;">
                  <i data-lucide="external-link" style="width: 15px; height: 15px;"></i>
                  Visualizar Original
                </button>
              </div>
            </div>

            <!-- Right Panel: Summary and Extracted OCR Text -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
              
              <div style="background-color: #fafafa; border-radius: var(--radius-md); padding: 1.25rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--accent); margin-bottom: 0.25rem;">
                  <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
                  <strong style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Resumo da Inteligência Artificial</strong>
                </div>
                <textarea id="detail-resumo-input" class="form-textarea" style="min-height: 100px; line-height: 1.5; font-size: 0.9rem; color: var(--text-secondary); border-color: var(--border-color); resize: vertical; padding: 0.6rem; font-style: italic;">${escapeHtml(evidence.resumo)}</textarea>
              </div>

              <div class="extracted-text-container">
                <div class="extracted-text-header">
                  <i data-lucide="file-digit" style="width: 16px; height: 16px; color: var(--text-secondary);"></i>
                  <span>Conteúdo Textual Extraído (Simulação OCR)</span>
                </div>
                <div class="extracted-text-box">
                  ${evidence.textoExtraido}
                </div>
              </div>

            </div>

          </div>
        </div>

        <div class="modal-footer">
          <button class="modal-close" id="details-delete-btn" style="background-color: #ff4757; color: white; border: none; border-radius: var(--radius-sm); padding: 0.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: background-color 0.2s; margin-right: auto;" title="Excluir evidência">
            <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
          </button>
            
          <button class="btn btn-secondary" id="details-close-bottom-btn" style="padding-left: 1.5rem; padding-right: 1.5rem;">Cancelar</button>
          <button class="btn btn-primary" id="details-save-btn" style="padding-left: 1.5rem; padding-right: 1.5rem;">Salvar alterações</button>
        </div>
      </div>
    `;

    const closeBtn = overlay.querySelector('#details-close-btn');
    const closeBottomBtn = overlay.querySelector('#details-close-bottom-btn');
    const saveBtn = overlay.querySelector('#details-save-btn');
    const titleInput = overlay.querySelector('#detail-title-input');
    const eventoInput = overlay.querySelector('#detail-evento-input');
    const categorySelect = overlay.querySelector('#detail-categoria-select');
    const responsavelInput = overlay.querySelector('#detail-responsavel-input');
    const dataInput = overlay.querySelector('#detail-data-input');
    const resumoInput = overlay.querySelector('#detail-resumo-input');

    let selectedTags = [...(evidence.tags || [])];

    function renderTagsWidget() {
      const displayContainer = overlay.querySelector('#detail-selected-tags-display');
      const selectElement = overlay.querySelector('#detail-add-tag-select');
      if (!displayContainer || !selectElement) return;
      
      displayContainer.innerHTML = '';
      if (selectedTags.length === 0) {
        displayContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-tertiary); font-style: italic;">Nenhuma tag selecionada</span>';
      } else {
        selectedTags.forEach(tag => {
          const badge = document.createElement('span');
          badge.className = 'tag-badge';
          badge.innerHTML = `
            <span>${escapeHtml(tag)}</span>
            <button type="button" class="tag-badge-remove" title="Remover tag">&times;</button>
          `;
          badge.querySelector('.tag-badge-remove').addEventListener('click', (e) => {
            e.preventDefault();
            selectedTags = selectedTags.filter(t => t !== tag);
            renderTagsWidget();
          });
          displayContainer.appendChild(badge);
        });
      }

      selectElement.innerHTML = '';
      
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = 'Adicionar tag...';
      defaultOpt.selected = true;
      selectElement.appendChild(defaultOpt);

      const tagsListArray = Array.isArray(tagsList) ? tagsList : [];
      const availableTags = tagsListArray.filter(tag => !selectedTags.includes(tag));
      
      availableTags.forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag;
        selectElement.appendChild(opt);
      });

      if (availableTags.length === 0) {
        defaultOpt.textContent = 'Todas as tags disponíveis já foram adicionadas';
        selectElement.disabled = true;
      } else {
        selectElement.disabled = false;
      }
    }

    // Initialize tags widget immediately
    renderTagsWidget();

    overlay.querySelector('#detail-add-tag-select').addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        if (!selectedTags.includes(val)) {
          selectedTags.push(val);
        }
        renderTagsWidget();
      }
    });

    let isSaving = false;

    function setSavingState(saving) {
      isSaving = saving;
      saveBtn.disabled = saving;
      saveBtn.classList.toggle('is-loading', saving);
      saveBtn.innerHTML = saving
        ? '<span class="btn-loading-spinner" aria-hidden="true"></span> Salvando...'
        : 'Salvar alterações';
      closeBottomBtn.disabled = saving;
      closeBtn.disabled = saving;
    }

    function showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `app-toast ${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.add('show');
      });

      window.setTimeout(() => {
        toast.classList.remove('show');
        window.setTimeout(() => toast.remove(), 220);
      }, 2600);
    }

    const doClose = () => {
      if (isSaving) return;
      overlay.remove();
      if (typeof onClose === 'function') {
        onClose();
      }
    };

    closeBtn.addEventListener('click', doClose);
    closeBottomBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) doClose();
    });

    saveBtn.addEventListener('click', async () => {
      if (isSaving) return;

      const updatedMetadata = {
        titulo: titleInput.value.trim() || evidence.nome,
        evento: eventoInput.value.trim() || 'Sem Evento',
        categoria: categorySelect.value,
        responsavel: responsavelInput.value.trim() || 'Não especificado',
        data: dataInput.value.trim() || new Date().toLocaleDateString('pt-BR'),
        resumo: resumoInput.value.trim() || 'Sem resumo disponível.',
        tags: selectedTags
      };

      setSavingState(true);

      try {
        const savedEvidence = await window.CerneApp.Api.updateEvidence(evidence.id, updatedMetadata);
        setSavingState(false);
        showToast('Alterações salvas com sucesso.', 'success');
        if (typeof onSave === 'function') {
          onSave(savedEvidence);
        }
        doClose();
      } catch (error) {
        setSavingState(false);
        alert(`Não foi possível salvar a evidência: ${error.message}`);
      }
    });

    overlay.querySelector('#btn-download-original').addEventListener('click', (e) => {
      e.preventDefault();
      if (evidence.downloadUrl) {
        window.open(evidence.downloadUrl, '_blank');
      }
    });

    overlay.querySelector('#btn-preview-original').addEventListener('click', () => {
      window.open(`/api/preview/${encodeURIComponent(evidence.id)}`, '_blank');
    });

    const deleteBtn = overlay.querySelector('#details-delete-btn');
    deleteBtn.addEventListener('click', async () => {
      const confirmDelete = confirm(`Tem certeza que deseja excluir a evidência "${titleText}"?\n\nEsta ação não pode ser desfeita.`);
      
      if (!confirmDelete) {
        return;
      }

      deleteBtn.disabled = true;
      const originalContent = deleteBtn.innerHTML;
      deleteBtn.innerHTML = '<i data-lucide="loader" style="width: 20px; height: 20px; animation: spin 1s linear infinite;\"></i>';

      try {
        await window.CerneApp.Api.deleteEvidence(evidence.id);
        alert('Evidência excluída com sucesso.');
        doClose();
        if (typeof onClose === 'function') {
          onClose();
        }
      } catch (error) {
        alert(`Não foi possível excluir a evidência: ${error.message}`);
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = originalContent;
      }
    });

    return overlay;
  }
};
