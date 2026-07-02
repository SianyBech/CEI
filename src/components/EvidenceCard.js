window.CerneApp.EvidenceCard = {
  render(evidences, onViewDetailsClick) {
    const container = document.createElement('div');
    
    if (evidences.length === 0) {
      container.className = 'table-container';
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="search-x" class="empty-state-icon"></i>
          <h3>Nenhuma evidência encontrada</h3>
          <p>Tente ajustar os termos de pesquisa ou cadastre uma nova evidência.</p>
        </div>
      `;
      return container;
    }

    container.className = 'evidence-grid';
    
    let cardsHTML = '';
    evidences.forEach(evidence => {
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
        .join('');

      // Match CERNE category badge color
      const categoryClass = `badge-${evidence.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

      cardsHTML += `
        <div class="evidence-card" data-id="${evidence.id}">
          <div class="card-header">
            <div style="display: flex; align-items: flex-start; gap: 0.65rem;">
              <i data-lucide="${iconName}" class="file-icon ${iconClass}" style="margin-top: 2px;"></i>
              <span class="card-title" title="${evidence.nome}">${evidence.nome}</span>
            </div>
            <span class="file-type-badge">${evidence.tipo}</span>
          </div>

          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <span class="badge ${categoryClass}">
              ${evidence.categoria}
            </span>
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
