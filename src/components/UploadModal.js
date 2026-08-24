window.CerneApp.UploadModal = {
  render(onClose, onAddEvidence, categories = [], tagsList = []) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'upload-modal-overlay';

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    overlay.innerHTML = `
      <div class="modal-content" id="modal-content-box">
        <div class="modal-header">
          <h2 class="modal-title">Nova Evidência</h2>
          <button class="modal-close" id="modal-close-btn">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <div class="modal-body" id="modal-body-container">
          <!-- Step 1: File Selection -->
          <div id="upload-step-select" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="dropzone" id="dropzone-box">
              <i data-lucide="upload-cloud" class="dropzone-icon"></i>
              <div class="dropzone-text">
                <strong>Arraste seu arquivo aqui</strong> ou clique para navegar
              </div>
              <div class="dropzone-subtext">
                Suporta PDF, Imagens (JPG/PNG) ou Documentos (DOCX) até 10MB
              </div>
              <input type="file" id="file-input-element" style="display: none;" accept=".pdf, .png, .jpg, .jpeg, .docx, .pptx">
            </div>

            <div class="file-selected-box" id="file-selected-info-box" style="display: none;">
              <div class="file-selected-info">
                <i data-lucide="file-check" class="file-icon-documento" id="selected-file-icon"></i>
                <span id="selected-file-name" style="word-break: break-all;">Nome_do_Arquivo.pdf</span>
              </div>
              <button class="btn btn-secondary btn-icon-only" id="remove-file-btn" style="border:none; background:transparent;" title="Remover Arquivo">
                <i data-lucide="trash-2" style="width: 16px; height: 16px; color: var(--danger);"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="modal-footer" id="modal-footer-container">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="modal-upload-submit-btn" disabled>Iniciar Análise</button>
        </div>
      </div>
    `;

    const fileInput = overlay.querySelector('#file-input-element');
    const dropzone = overlay.querySelector('#dropzone-box');
    const fileInfoBox = overlay.querySelector('#file-selected-info-box');
    const selectedFileName = overlay.querySelector('#selected-file-name');
    const selectedFileIcon = overlay.querySelector('#selected-file-icon');
    const removeFileBtn = overlay.querySelector('#remove-file-btn');
    const submitBtn = overlay.querySelector('#modal-upload-submit-btn');
    const cancelBtn = overlay.querySelector('#modal-cancel-btn');
    const closeBtn = overlay.querySelector('#modal-close-btn');

    let selectedFile = null;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent)';
      dropzone.style.backgroundColor = 'var(--accent-light)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--border-color)';
      dropzone.style.backgroundColor = '#fafafa';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-color)';
      dropzone.style.backgroundColor = '#fafafa';
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    function handleFileSelect(file) {
      selectedFile = file;
      selectedFileName.textContent = file.name;
      
      const ext = file.name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg'].includes(ext)) {
        selectedFileIcon.setAttribute('data-lucide', 'image');
        selectedFileIcon.className = 'file-icon file-icon-imagem';
      } else if (ext === 'pdf') {
        selectedFileIcon.setAttribute('data-lucide', 'file-text');
        selectedFileIcon.className = 'file-icon file-icon-pdf';
      } else {
        selectedFileIcon.setAttribute('data-lucide', 'file');
        selectedFileIcon.className = 'file-icon file-icon-documento';
      }
      
      lucide.createIcons({
        attrs: { style: 'width: 16px; height: 16px;' },
        nameAttr: 'data-lucide',
        node: fileInfoBox
      });

      fileInfoBox.style.display = 'flex';
      submitBtn.removeAttribute('disabled');
    }

    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      fileInput.value = '';
      fileInfoBox.style.display = 'none';
      submitBtn.setAttribute('disabled', 'true');
    });

    const doClose = () => {
      overlay.remove();
      if (typeof onClose === 'function') onClose();
    };

    closeBtn.addEventListener('click', doClose);
    cancelBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) doClose();
    });

    submitBtn.addEventListener('click', () => {
      if (!selectedFile) return;

      submitBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      closeBtn.style.display = 'none';

      const modalBody = overlay.querySelector('#modal-body-container');
      modalBody.innerHTML = `
        <div class="ai-processing-container">
          <div class="ai-processing-header">
            <div class="ai-icon-pulse">
              <i data-lucide="sparkles" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <span class="ai-processing-title">Upload e análise de evidência</span>
              <p style="font-size: 0.75rem; color: var(--text-secondary);">Enviando arquivo e extraindo metadados com OCR + IA...</p>
            </div>
          </div>

          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="upload-progress-fill"></div>
          </div>

          <div class="processing-steps-log" id="steps-log-console"></div>
        </div>
      `;

      lucide.createIcons({ nameAttr: 'data-lucide', node: modalBody });

      const progressFill = modalBody.querySelector('#upload-progress-fill');
      const logConsole = modalBody.querySelector('#steps-log-console');

      function addLog(message, completed = false) {
        const logItem = document.createElement('div');
        logItem.className = `step-log-item ${completed ? 'completed' : 'active'}`;
        logItem.innerHTML = `
          <span class="step-status-indicator">${completed ? '<span class="step-log-checkmark">✓</span>' : '⚙'}</span>
          <span>${message}</span>
        `;
        logConsole.appendChild(logItem);
        logConsole.scrollTop = logConsole.scrollHeight;
        return logItem;
      }

      const pendingLog = addLog('Preparando upload...');
      setTimeout(() => {
        pendingLog.classList.remove('active');
        pendingLog.classList.add('completed');
        pendingLog.querySelector('.step-status-indicator').innerHTML = '<span class="step-log-checkmark">✓</span>';

        const uploadingLog = addLog('Enviando arquivo para o servidor...');

        window.CerneApp.Api.uploadEvidence(selectedFile, (percentage) => {
          progressFill.style.width = `${percentage}%`;
        })
          .then((uploadedEvidence) => {
            uploadingLog.classList.remove('active');
            uploadingLog.classList.add('completed');
            uploadingLog.querySelector('.step-status-indicator').innerHTML = '<span class="step-log-checkmark">✓</span>';
            addLog('Arquivo processado com sucesso.', true);
            progressFill.style.width = '100%';
            closeBtn.style.display = 'flex';
            showSuccessScreen(uploadedEvidence);
          })
          .catch((error) => {
            uploadingLog.classList.remove('active');
            uploadingLog.classList.add('completed');
            uploadingLog.querySelector('.step-status-indicator').innerHTML = '<span class="step-log-checkmark">✕</span>';
            progressFill.style.backgroundColor = 'var(--danger)';
            modalBody.innerHTML = `
              <div class="ai-processing-container">
                <div class="ai-processing-header">
                  <div class="ai-icon-pulse" style="background-color: var(--danger-bg);">
                    <i data-lucide="alert-triangle" style="width: 20px; height: 20px; color: var(--danger);"></i>
                  </div>
                  <div>
                    <span class="ai-processing-title">Falha no upload</span>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${error.message}</p>
                  </div>
                </div>
              </div>
            `;
            lucide.createIcons({ nameAttr: 'data-lucide', node: modalBody });
            closeBtn.style.display = 'flex';
          });
      }, 300);
    });

    function showSuccessScreen(evidence) {
      closeBtn.style.display = 'flex';
      
      const modalBody = overlay.querySelector('#modal-body-container');
      const footer = overlay.querySelector('#modal-footer-container');

      footer.innerHTML = `
        <button class="btn btn-primary" id="modal-success-done-btn">Confirmar e Salvar</button>
      `;

      modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; animation: fadeIn var(--transition-normal) forwards;">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem;">
            <div style="width: 48px; height: 48px; background-color: var(--success-bg); border: 2px solid var(--success-border); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: var(--success);">
              <i data-lucide="check-circle" style="width: 26px; height: 26px;"></i>
            </div>
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; color: var(--text-primary);">Evidência Analisada com Sucesso</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">Revise e corrija os metadados gerados pela Inteligência Artificial se necessário:</p>
            </div>
          </div>
 
          <div style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-secondary); padding: 1.25rem;">
            <div class="edit-form-grid">
              
              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-titulo">Título da Evidência</label>
                <input type="text" class="form-input" id="edit-titulo" value="${escapeHtml(evidence.titulo || evidence.nome)}" placeholder="Título da evidência">
              </div>
 
              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-nome">Arquivo Original</label>
                <input type="text" class="form-input" id="edit-nome" value="${escapeHtml(evidence.nome)}" disabled style="background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;">
              </div>
 
              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-evento">Evento de Origem</label>
                <input type="text" class="form-input" id="edit-evento" value="${escapeHtml(evidence.evento)}" placeholder="Ex: Reunião do Conselho, Mentoria, etc.">
              </div>
 
              <div class="form-group">
                <label class="form-label">Categorias CERNE</label>
                <div class="tags-selector-wrapper">
                  <div class="selected-tags-display" id="upload-selected-categories-display"></div>
                  <select class="form-select" id="upload-add-category-select" style="margin-top: 0.35rem;"></select>
                </div>
              </div>
 
              <div class="form-group">
                <label class="form-label" for="edit-responsavel">Responsável pelo Envio</label>
                <input type="text" class="form-input" id="edit-responsavel" value="${escapeHtml(evidence.responsavel)}" placeholder="Nome do responsável">
              </div>
 
              <div class="form-group">
                <label class="form-label" for="edit-data">Data de Registro</label>
                <input type="text" class="form-input" id="edit-data" value="${escapeHtml(evidence.data)}">
              </div>
              
              <div class="form-group">
                <label class="form-label">Tags da Evidência</label>
                <div class="tags-selector-wrapper">
                  <div class="selected-tags-display" id="selected-tags-display"></div>
                  <select class="form-select" id="add-tag-select" style="margin-top: 0.35rem;"></select>
                </div>
              </div>
 
              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-resumo">Resumo da IA</label>
                <textarea class="form-textarea" id="edit-resumo" placeholder="Escreva um breve resumo da evidência...">${escapeHtml(evidence.resumo)}</textarea>
              </div>
 
            </div>
          </div>
        </div>
      `;
 
      lucide.createIcons({ nameAttr: 'data-lucide', node: modalBody });

      // Widget de Categorias
      let selectedCategories = Array.isArray(evidence.categorias) && evidence.categorias.length > 0
        ? [...evidence.categorias]
        : (evidence.categoria ? [evidence.categoria] : []);

      function renderUploadCategoriesWidget() {
        const displayContainer = modalBody.querySelector('#upload-selected-categories-display');
        const selectElement = modalBody.querySelector('#upload-add-category-select');
        if (!displayContainer || !selectElement) return;

        displayContainer.innerHTML = '';
        if (selectedCategories.length === 0) {
          displayContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-tertiary); font-style: italic;">Nenhuma categoria selecionada</span>';
        } else {
          selectedCategories.forEach(cat => {
            const categoryClass = `badge-${cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
            const badge = document.createElement('span');
            badge.className = `badge ${categoryClass}`;
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
              renderUploadCategoriesWidget();
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

// Busca direto da chave appSettings do estado
const appSettings = window.CerneApp?.state?.appSettings || {};

// Categorias [linha 250 do UploadModal.js]:
const categoriesArray = Array.isArray(appSettings.categories) && appSettings.categories.length > 0
  ? appSettings.categories
  : (Array.isArray(categories) ? categories : []);

// Tags [linha 292 do UploadModal.js]:
const tagsListArray = Array.isArray(appSettings.tags) && appSettings.tags.length > 0
  ? appSettings.tags
  : (Array.isArray(tagsList) ? tagsList : []);

        const availableCategories = categoriesArray.filter(cat => !selectedCategories.includes(cat));

        availableCategories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          selectElement.appendChild(opt);
        });

        selectElement.disabled = availableCategories.length === 0;
      }

      renderUploadCategoriesWidget();

      modalBody.querySelector('#upload-add-category-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val && !selectedCategories.includes(val)) {
          selectedCategories.push(val);
          renderUploadCategoriesWidget();
        }
      });

      // Widget de Tags
      let selectedTags = [...(evidence.tags || [])];

      function renderTagsWidget() {
        const displayContainer = modalBody.querySelector('#selected-tags-display');
        const selectElement = modalBody.querySelector('#add-tag-select');
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

      modalBody.querySelector('#add-tag-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val && !selectedTags.includes(val)) {
          selectedTags.push(val);
          renderTagsWidget();
        }
      });
 
      footer.querySelector('#modal-success-done-btn').addEventListener('click', async () => {
        const titleInput = modalBody.querySelector('#edit-titulo');
        const eventoInput = modalBody.querySelector('#edit-evento');
        const responsavelInput = modalBody.querySelector('#edit-responsavel');
        const dataInput = modalBody.querySelector('#edit-data');
        const resumoInput = modalBody.querySelector('#edit-resumo');

        const dataDigitada = dataInput.value.trim() || new Date().toLocaleDateString('pt-BR');

        if (window.CerneApp.Utils?.isFutureDate?.(dataDigitada)) {
          const confirmFuture = confirm('A data informada é uma data futura.\n\nTem certeza de que deseja cadastrar a evidência com esta data?');
          if (!confirmFuture) return;
        }

        const updatedMetadata = {
          titulo: titleInput.value.trim() || evidence.nome,
          evento: eventoInput.value.trim() || 'Sem Evento',
          categorias: selectedCategories,
          categoria: selectedCategories[0] || 'Geral',
          responsavel: responsavelInput.value.trim() || 'Não especificado',
          data: dataDigitada,
          resumo: resumoInput.value.trim() || 'Sem resumo disponível.',
          tags: selectedTags
        };
 
        try {
          const savedEvidence = await window.CerneApp.Api.updateEvidence(evidence.id, updatedMetadata);
          if (typeof onAddEvidence === 'function') {
            onAddEvidence(savedEvidence || { ...evidence, ...updatedMetadata });
          }
          doClose();
        } catch (error) {
          alert(`Não foi possível salvar a evidência: ${error.message}`);
        }
      });
    }

    return overlay;
  }
};