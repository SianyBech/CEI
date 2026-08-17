window.CerneApp.EvidenceCard = {
  render(evidences, onViewDetailsClick) {
    const container = document.createElement('div');

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    
    if (evidences.length === 0) {
      container.className = 'table-container';
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-illustration">
            <div class="empty-state-illustration-glow"></div>
            <div class="empty-state-illustration-frame">
              <i data-lucide="file-text" class="empty-state-illustration-icon doc-icon"></i>
              <i data-lucide="search" class="empty-state-illustration-icon search-icon"></i>
            </div>
          </div>
          <h3>Nenhuma evidência encontrada</h3>
          <p>Tente ajustar os termos de pesquisa ou cadastrar uma nova evidência.</p>
          <button type="button" class="empty-state-action-btn">
            <i data-lucide="plus" class="empty-state-action-icon"></i>
            Cadastrar nova evidência
          </button>
          <span class="empty-state-tip">Pressione C para cadastrar nova evidência.</span>
        </div>
      `;
      return container;
    }

    container.className = 'evidence-grid';
    
    let cardsHTML = '';
    evidences.forEach(evidence => {
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
        .join('');

      // Match CERNE category badge color
      const categoryClass = `badge-${evidence.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

        const categoriesList = Array.isArray(evidence.categorias) && evidence.categorias.length > 0
    ? evidence.categorias
    : (evidence.categoria ? [evidence.categoria] : []);

        const categoriesHTML = categoriesList.map(cat => {
          const categoryClass = `badge-${cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;
          return `<span class="badge ${categoryClass}">${escapeHtml(cat)}</span>`;
        }).join(' ');

      cardsHTML += `
        <div class="evidence-card" data-id="${evidence.id}">
          <div class="card-header">
            <div style="display: flex; align-items: flex-start; gap: 0.65rem;">
              <i data-lucide="${iconName}" class="file-icon ${iconClass}" style="margin-top: 2px;"></i>
              <span class="card-title" title="${evidence.titulo || evidence.nome}">${evidence.titulo || evidence.nome}</span>
            </div>
            <span class="file-type-badge">${evidence.tipo}</span>
          </div>

        
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          ${categoriesHTML}
        </div>

          <div class="card-body">
            <strong style="display:block; margin-bottom: 2px; color: var(--text-primary); font-size: 0.8rem;">
              Evento: ${evidence.evento}
            </strong>
            ${evidence.resumo}
          </div>

          <div class="tags-list" style="margin-top: 0.25rem;">
            ${tagsHTML}
          </div>

          <div class="card-footer">
            <div class="card-author">
              <div class="avatar-initial">${evidence.responsavel.charAt(0)}</div>
              <span>${evidence.responsavel}</span>
            </div>
            <span style="font-size: 0.7rem; color: var(--text-tertiary);">${evidence.data}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = cardsHTML;

    // Attach click listeners to the cards
    container.querySelectorAll('.evidence-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        onViewDetailsClick(id);
      });
    });

    return container;
  }
};
