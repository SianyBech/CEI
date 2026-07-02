window.CerneApp.EvidenceDetails = {
  render(evidence, onClose) {
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

    overlay.innerHTML = `
      <div class="modal-content detail-modal-width">
        <div class="modal-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <i data-lucide="${iconName}" class="file-icon ${iconClass}"></i>
            <h2 class="modal-title" style="font-size: 1.1rem; max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${evidence.nome}">
              ${evidence.nome}
            </h2>
          </div>
          <button class="modal-close" id="details-close-btn">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <div class="modal-body" style="padding: 1.5rem;">
          <div class="details-grid">
            
            <!-- Left Panel: Metadata Info Card -->
            <div class="details-sidebar">
              <div class="detail-item">
                <span class="detail-label">Categoria CERNE</span>
                <div>
                  <span class="badge ${categoryClass}" style="font-size: 0.8rem; padding: 0.25rem 0.65rem;">
                    ${evidence.categoria}
                  </span>
                </div>
              </div>

              <div class="detail-item">
                <span class="detail-label">Evento de Origem</span>
                <span class="detail-val" style="color: var(--text-primary);">${evidence.evento}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Responsável pelo Envio</span>
                <div class="card-author" style="margin-top: 0.15rem;">
                  <div class="avatar-initial" style="width: 24px; height: 24px; font-size: 0.8rem;">
                    ${evidence.responsavel.charAt(0)}
                  </div>
                  <span class="detail-val">${evidence.responsavel}</span>
                </div>
              </div>

              <div class="detail-item">
                <span class="detail-label">Data do Registro</span>
                <span class="detail-val">${evidence.data}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Extensão de Arquivo</span>
                <span class="file-type-badge" style="font-size: 0.8rem; font-weight: bold;">
                  ${evidence.tipo}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Tags da Evidência</span>
                <div class="tags-list" style="margin-top: 0.25rem;">
                  ${tagsHTML || '<span style="color: var(--text-tertiary); font-size: 0.75rem;">Sem tags</span>'}
                </div>
              </div>

              <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="#" class="btn btn-primary" id="btn-download-original" style="width: 100%; text-decoration: none;">
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
          <button class="btn btn-secondary" id="details-close-bottom-btn" style="padding-left: 1.5rem; padding-right: 1.5rem;">Fechar</button>
        </div>
      </div>
    `;

    const closeBtn = overlay.querySelector('#details-close-btn');
    const closeBottomBtn = overlay.querySelector('#details-close-bottom-btn');

    const doClose = () => {
      overlay.remove();
      onClose();
    };

    closeBtn.addEventListener('click', doClose);
    closeBottomBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) doClose();
    });

    // Mock downloads and previews
    overlay.querySelector('#btn-download-original').addEventListener('click', (e) => {
      e.preventDefault();
      alert(`[Simulação de Download]\nBaixando o arquivo original: ${evidence.nome}`);
    });

    overlay.querySelector('#btn-preview-original').addEventListener('click', () => {
      alert(`[Simulação de Visualização]\nAbrindo visualizador para o arquivo: ${evidence.nome}`);
    });

    return overlay;
  }
};
