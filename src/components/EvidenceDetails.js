window.CerneApp.EvidenceDetails = {
  render(evidence, onClose, onSave, categories = [], tagsList = [], onDelete) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'details-modal-overlay';

    // Match CERNE category badge color
    const primaryCat = evidence.categoria || (evidence.categorias && evidence.categorias[0]) || 'Geral';
    const categoryClass = `badge-${primaryCat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

    // Determine file icon
    let iconName = 'file';
    let iconClass = 'file-icon-documento';
    if (evidence.tipo === 'pdf') {
      iconName = 'file-text';
      iconClass = 'file-icon-pdf';
    } else if (evidence.tipo === 'imagem') {
      iconName = 'image';
      iconClass = 'file-icon-imagem';
    } else if (evidence.tipo === 'link') {
      iconName = 'globe';
      iconClass = 'file-icon-link';
    }

    const titleText = evidence.titulo || evidence.nome;

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function ensureAbsoluteUrl(url) {
      if (!url) return '#';
      const trimmed = url.trim();
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    }

    // Construção dinâmica e limpa dos botões de ação (Suporte Híbrido)
    let actionsHtml = '';

    if (evidence.link) {
      const externalUrl = ensureAbsoluteUrl(evidence.link);
      actionsHtml += `
        <button type="button" class="btn btn-secondary" id="btn-open-link" data-url="${escapeHtml(externalUrl)}" style="width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; margin-bottom: 0.5rem;">
          <i data-lucide="external-link" style="width: 15px; height: 15px;"></i>
          Abrir link
        </button>
      `;
    }

    if (evidence.downloadUrl && evidence.tipo !== 'link') {
      actionsHtml += `
        <a href="${escapeHtml(evidence.downloadUrl)}" target="_blank" class="btn btn-secondary" id="btn-download-original" style="width: 100%; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; margin-bottom: 0.5rem;">
          <i data-lucide="download" style="width: 15px; height: 15px;"></i>
          Baixar Arquivo
        </a>
        <button class="btn btn-secondary" id="btn-preview-original" style="width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
          <i data-lucide="eye" style="width: 15px; height: 15px;"></i>
          Visualizar Arquivo Original
        </button>
      `;
    }

    // Construção correta dos campos de Origem (Arquivo e/ou Link separados)
    let originalSourceHtml = '';
    const hasFile = evidence.tipo !== 'link' && evidence.nome && evidence.nome !== evidence.link;

    if (hasFile) {
      originalSourceHtml += `
        <div class="detail-item">
          <label class="detail-label">Arquivo Original</label>
          <input class="form-input" value="${escapeHtml(evidence.nome)}" disabled style="background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;" />
        </div>
      `;
    }

    if (evidence.link) {
      originalSourceHtml += `
        <div class="detail-item">
          <label class="detail-label">Link Vinculado</label>
          <input class="form-input" value="${escapeHtml(evidence.link)}" disabled style="background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;" />
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="modal-content detail-modal-width" style="height: 85vh; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
  
        <!-- Header da Modal -->
        <div class="modal-header" style="flex-shrink: 0;">
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

        <!-- Body da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; min-height: 0; display: flex; overflow: hidden;">
          <div class="details-grid" style="flex: 1; min-height: 0; height: 100%; display: flex; gap: 1.5rem; overflow: hidden; width: 100%;">
            
            <!-- Left Panel: Metadados Editáveis -->
            <div class="details-sidebar" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; padding-right: 0.5rem;">
              
              <div class="detail-item">
                <label class="detail-label" for="detail-title-input">Título da Evidência</label>
                <input id="detail-title-input" class="form-input" value="${escapeHtml(titleText)}" />
              </div>

              <!-- Renderização condicional correta dos campos de origem -->
              ${originalSourceHtml}

              <div class="detail-item">
                <label class="detail-label" for="detail-evento-input">Evento de Origem</label>
                <input id="detail-evento-input" class="form-input" value="${escapeHtml(evidence.evento)}" />
              </div>

              <div class="detail-item">
                <label class="detail-label">Categorias CERNE</label>
                <div class="tags-selector-wrapper">
                  <div class="selected-tags-display" id="detail-selected-categories-display"></div>
                  <select class="form-select" id="detail-add-category-select" style="margin-top: 0.35rem;"></select>
                </div>
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-responsavel-input">Responsável pelo Envio</label>
                <select id="detail-responsavel-input" class="form-select"></select>
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-data-input">Data do Registro</label>
                <input id="detail-data-input" class="form-input" value="${escapeHtml(evidence.data)}" />
              </div>

              <div class="detail-item">
                <label class="detail-label">Tags da Evidência</label>
                <div class="tags-selector-wrapper">
                  <div class="selected-tags-display" id="detail-selected-tags-display"></div>
                  <select class="form-select" id="detail-add-tag-select" style="margin-top: 0.35rem;"></select>
                </div>
              </div>

              <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.5rem;">
                ${actionsHtml}
              </div>

            </div>

            <!-- Right Panel: Resumo IA e OCR -->
            <div style="flex: 1.2; min-height: 0; height: 100%; display: flex; flex-direction: column; gap: 1rem; overflow: hidden;">
              
              <div style="flex: 1; min-height: 0; background-color: #fafafa; border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; overflow: hidden;">
                <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--accent); margin-bottom: 0.5rem; flex-shrink: 0;">
                  <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
                  <strong style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Resumo da Inteligência Artificial</strong>
                </div>

                <div id="resumo-display-container" style="flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden;">
                  <div class="form-textarea-view" style="flex: 1; min-height: 0; overflow-y: auto; line-height: 1.6; font-size: 0.9rem; color: var(--text-secondary); padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; background-color: #ffffff;">
                    ${(evidence.resumo || 'Nenhum resumo gerado.').replace(/\n/g, '<br>')}
                  </div>
                </div>

                <textarea id="detail-resumo-input" class="form-textarea" style="display: none; width: 100%; flex: 1; min-height: 0; line-height: 1.5; font-size: 0.9rem; color: var(--text-secondary); border-color: var(--border-color); resize: none; padding: 0.6rem;">${escapeHtml(evidence.resumo || '')}</textarea>
              </div>

              <div class="extracted-text-container" style="flex: 1; min-height: 0; background-color: #fafafa; border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--border-color); display: flex; flex-direction: column; overflow: hidden;">
                <div class="extracted-text-header" style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.5rem; flex-shrink: 0;">
                  <i data-lucide="file-digit" style="width: 16px; height: 16px; color: var(--text-secondary);"></i>
                  <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--text-secondary);">Conteúdo Extraído (OCR / Web Scraping)</span>
                </div>

                <div class="extracted-text-box" style="flex: 1; min-height: 0; overflow-y: auto; line-height: 1.5; font-size: 0.85rem; color: var(--text-secondary); padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; background-color: #ffffff; white-space: pre-wrap;">
                  ${escapeHtml(evidence.textoExtraido || 'Nenhum conteúdo extraído.')}
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- Footer da Modal -->
        <div class="modal-footer" style="flex-shrink: 0; display: flex; align-items: center; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color);">
          <button class="modal-close" id="details-delete-btn" style="background-color: #ff4757; color: white; border: none; border-radius: var(--radius-sm); padding: 0.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: background-color 0.2s; margin-right: auto;" title="Excluir evidência">
            <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
          </button>
            
          <button class="btn btn-secondary" id="details-close-bottom-btn" style="padding-left: 1.5rem; padding-right: 1.5rem;">Cancelar</button>
          <button class="btn btn-primary" id="details-save-btn" style="padding-left: 1.5rem; padding-right: 1.5rem; margin-left: 0.5rem;">Salvar alterações</button>
        </div>

      </div>
    `;

    const closeBtn = overlay.querySelector('#details-close-btn');
    const closeBottomBtn = overlay.querySelector('#details-close-bottom-btn');
    const saveBtn = overlay.querySelector('#details-save-btn');
    const titleInput = overlay.querySelector('#detail-title-input');
    const eventoInput = overlay.querySelector('#detail-evento-input');
    const dataInput = overlay.querySelector('#detail-data-input');
    const resumoInput = overlay.querySelector('#detail-resumo-input');

    // Evento seguro para abrir link externo usando o atributo data-url
    const openLinkBtn = overlay.querySelector('#btn-open-link');
    if (openLinkBtn) {
      openLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUrl = openLinkBtn.getAttribute('data-url');
        if (targetUrl && targetUrl !== '#') {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        } else {
          alert('Link não disponível.');
        }
      });
    }

    // Configuração das categorias
    let selectedCategories = Array.isArray(evidence.categorias) 
      ? [...evidence.categorias] 
      : (evidence.categoria ? [evidence.categoria] : []);

    function renderCategoriesWidget() {
      const displayContainer = overlay.querySelector('#detail-selected-categories-display');
      const selectElement = overlay.querySelector('#detail-add-category-select');
      if (!displayContainer || !selectElement) return;

      displayContainer.innerHTML = '';
      if (selectedCategories.length === 0) {
        displayContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-tertiary); font-style: italic;">Nenhuma categoria selecionada</span>';
      } else {
        selectedCategories.forEach(cat => {
          const customStyle = window.getCategoryStyle ? window.getCategoryStyle(cat) : '';
          const catClass = `badge-${cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

          const badge = document.createElement('span');
          badge.className = `badge ${catClass}`;
          if (customStyle) badge.setAttribute('style', customStyle);
          badge.style.display = 'inline-flex';
          badge.style.alignItems = 'center';
          badge.style.gap = '0.35rem';
          badge.style.padding = '0.25rem 0.5rem';

          badge.innerHTML = `
            <span>${escapeHtml(cat)}</span>
            <button type="button" class="tag-badge-remove" style="background:none; border:none; cursor:pointer; font-size: 0.9rem;" title="Remover categoria">&times;</button>
          `;

          badge.querySelector('.tag-badge-remove').addEventListener('click', (e) => {
            e.preventDefault();
            selectedCategories = selectedCategories.filter(c => c !== cat);
            renderCategoriesWidget();
          });

          displayContainer.appendChild(badge);
        });
      }

      selectElement.innerHTML = '';
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = 'Adicionar categoria...';
      defaultOpt.selected = true;
      selectElement.appendChild(defaultOpt);

      const categoriesArray = Array.isArray(categories) ? categories : [];
      const availableCategories = categoriesArray.filter(cat => !selectedCategories.includes(cat));

      availableCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        selectElement.appendChild(opt);
      });

      selectElement.disabled = availableCategories.length === 0;
    }

    renderCategoriesWidget();

    overlay.querySelector('#detail-add-category-select').addEventListener('change', (e) => {
      const val = e.target.value;
      if (val && !selectedCategories.includes(val)) {
        selectedCategories.push(val);
        renderCategoriesWidget();
      }
    });

    // Configuração das tags
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

      selectElement.disabled = availableTags.length === 0;
    }

    renderTagsWidget();

    overlay.querySelector('#detail-add-tag-select').addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        if (!selectedTags.includes(val)) selectedTags.push(val);
        renderTagsWidget();
      }
    });

    // Responsáveis
    (async () => {
      const selectResponsavel = overlay.querySelector('#detail-responsavel-input');
      if (!selectResponsavel) return;

      try {
        const listaResponsaveis = await window.CerneApp.Api.fetchResponsaveis();
        const responsavelAtual = evidence.responsavel || '';

        selectResponsavel.innerHTML = '';
        if (responsavelAtual && !listaResponsaveis.includes(responsavelAtual)) {
          listaResponsaveis.unshift(responsavelAtual);
        }

        listaResponsaveis.forEach(nome => {
          const option = document.createElement('option');
          option.value = nome;
          option.textContent = nome;
          if (nome === responsavelAtual) option.selected = true;
          selectResponsavel.appendChild(option);
        });
      } catch (error) {
        selectResponsavel.innerHTML = `<option value="${escapeHtml(evidence.responsavel || 'Equipe CEI')}" selected>${escapeHtml(evidence.responsavel || 'Equipe CEI')}</option>`;
      }
    })();

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
      requestAnimationFrame(() => toast.classList.add('show'));
      window.setTimeout(() => {
        toast.classList.remove('show');
        window.setTimeout(() => toast.remove(), 220);
      }, 2600);
    }

    const doClose = () => {
      if (isSaving) return;
      overlay.remove();
      if (typeof onClose === 'function') onClose();
    };

    closeBtn.addEventListener('click', doClose);
    closeBottomBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) doClose();
    });

    saveBtn.addEventListener('click', async () => {
      if (isSaving) return;

      const dataDigitada = dataInput.value.trim() || new Date().toLocaleDateString('pt-BR');

      if (window.CerneApp.Utils?.isFutureDate?.(dataDigitada)) {
        if (!confirm('A data informada é uma data futura.\n\nTem certeza de que deseja salvar a evidência com esta data?')) {
          return;
        }
      }

      const responsavelInput = overlay.querySelector('#detail-responsavel-input');

      const updatedMetadata = {
        titulo: titleInput.value.trim() || evidence.nome,
        evento: eventoInput.value.trim() || 'Sem Evento',
        categorias: selectedCategories,
        categoria: selectedCategories.length > 0 ? selectedCategories[0] : 'Geral',
        responsavel: responsavelInput ? responsavelInput.value.trim() : (evidence.responsavel || 'Não especificado'),
        data: dataDigitada,
        resumo: resumoInput.value.trim() || 'Sem resumo disponível.',
        tags: selectedTags
      };

      setSavingState(true);

      try {
        const savedEvidence = await window.CerneApp.Api.updateEvidence(evidence.id, updatedMetadata);
        setSavingState(false);
        showToast('Alterações salvas com sucesso.', 'success');
        if (typeof onSave === 'function') onSave(savedEvidence);
        doClose();
      } catch (error) {
        setSavingState(false);
        alert(`Não foi possível salvar a evidência: ${error.message}`);
      }
    });

    const downloadBtn = overlay.querySelector('#btn-download-original');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (evidence.downloadUrl) window.open(evidence.downloadUrl, '_blank');
      });
    }

    const previewBtn = overlay.querySelector('#btn-preview-original');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        window.open(`/api/preview/${encodeURIComponent(evidence.id)}`, '_blank');
      });
    }

    const deleteBtn = overlay.querySelector('#details-delete-btn');
    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Tem certeza que deseja excluir a evidência "${titleText}"?\n\nEsta ação não pode ser desfeita.`)) return;

      const originalContent = deleteBtn.innerHTML;
      deleteBtn.disabled = true;
      deleteBtn.innerHTML = '<i data-lucide="loader" style="width: 20px; height: 20px; animation: spin 1s linear infinite;"></i>';

      try {
        await window.CerneApp.Api.deleteEvidence(evidence.id);
        alert('Evidência excluída com sucesso.');
        doClose();
        if (typeof onDelete === 'function') onDelete(evidence.id);
      } catch (error) {
        alert(`Não foi possível excluir a evidência: ${error.message}`);
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = originalContent;
      }
    });

    return overlay;
  }
};