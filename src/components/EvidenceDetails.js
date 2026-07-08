window.CerneApp.EvidenceDetails = {
  render(evidence, onClose, onSave) {
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

    // Generate tags HTML
    const tagsHTML = (evidence.tags || [])
      .map(tag => `<span class="tag">${tag}</span>`)
      .join(' ');

    const titleText = evidence.titulo || evidence.nome;

    overlay.innerHTML = `
      <div class="modal-content detail-modal-width">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <i data-lucide="${iconName}" class="file-icon ${iconClass}"></i>
            <h2 class="modal-title" style="font-size: 1.1rem; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${titleText}">
              ${titleText}
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
                <input id="detail-title-input" class="form-input" value="${titleText}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-file-name">Arquivo Original</label>
                <input id="detail-file-name" class="form-input" value="${evidence.nome}" disabled style="background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-evento-input">Evento de Origem</label>
                <input id="detail-evento-input" class="form-input" value="${evidence.evento}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-categoria-select">Categoria CERNE</label>
                <select id="detail-categoria-select" class="form-select">
                  <option value="Capacitação" ${evidence.categoria === 'Capacitação' ? 'selected' : ''}>Capacitação</option>
                  <option value="Planejamento" ${evidence.categoria === 'Planejamento' ? 'selected' : ''}>Planejamento</option>
                  <option value="Gestão" ${evidence.categoria === 'Gestão' ? 'selected' : ''}>Gestão</option>
                  <option value="Assessoria" ${evidence.categoria === 'Assessoria' ? 'selected' : ''}>Assessoria</option>
                  <option value="Sustentabilidade" ${evidence.categoria === 'Sustentabilidade' ? 'selected' : ''}>Sustentabilidade</option>
                  <option value="Qualificação" ${evidence.categoria === 'Qualificação' ? 'selected' : ''}>Qualificação</option>
                </select>
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-responsavel-input">Responsável pelo Envio</label>
                <input id="detail-responsavel-input" class="form-input" value="${evidence.responsavel}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-data-input">Data do Registro</label>
                <input id="detail-data-input" class="form-input" value="${evidence.data}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-tags-input">Tags da Evidência</label>
                <input id="detail-tags-input" class="form-input" value="${(evidence.tags || []).join(', ')}" />
              </div>

              <div class="detail-item">
                <label class="detail-label" for="detail-resumo-input">Resumo da IA</label>
                <textarea id="detail-resumo-input" class="form-textarea" style="min-height: 90px;">${evidence.resumo}</textarea>
              </div>

              <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.5rem;">
                <button class="btn btn-primary" id="details-save-btn" style="width: 100%;">Salvar alterações</button>
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
              
              <div style="background-color: #fafafa; border-radius: var(--radius-md); padding: 1.25rem; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--accent); margin-bottom: 0.5rem;">
                  <i data-lucide="sparkles" style="width: 16px; height: 16px;"></i>
                  <strong style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Resumo da Inteligência Artificial</strong>
                </div>
                <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary); font-style: italic;">
                  "${evidence.resumo}"
                </p>
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

        <button class="modal-close" id="details-delete-btn" style="background-color: #ff4757; color: white; border: none; border-radius: var(--radius-sm); padding: 0.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: background-color 0.2s;" title="Excluir evidência">
              <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
            </button>
            
          <button class="btn btn-secondary" id="details-close-bottom-btn" style="padding-left: 1.5rem; padding-right: 1.5rem;">Fechar</button>
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
    const tagsInput = overlay.querySelector('#detail-tags-input');
    const resumoInput = overlay.querySelector('#detail-resumo-input');

    const doClose = () => {
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
      const updatedMetadata = {
        titulo: titleInput.value.trim() || evidence.nome,
        evento: eventoInput.value.trim() || 'Sem Evento',
        categoria: categorySelect.value,
        responsavel: responsavelInput.value.trim() || 'Não especificado',
        data: dataInput.value.trim() || new Date().toLocaleDateString('pt-BR'),
        resumo: resumoInput.value.trim() || 'Sem resumo disponível.',
        tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      try {
        const savedEvidence = await window.CerneApp.Api.updateEvidence(evidence.id, updatedMetadata);
        if (typeof onSave === 'function') {
          onSave(savedEvidence);
        }
        doClose();
      } catch (error) {
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
