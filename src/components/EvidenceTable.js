window.CerneApp.EvidenceTable = {
  render(evidences, onViewDetailsClick) {
    const container = document.createElement('div');
    container.className = 'table-container';

    if (evidences.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="search-x" class="empty-state-icon"></i>
          <h3>Nenhuma evidência encontrada</h3>
          <p>Tente ajustar os termos de pesquisa ou cadastre uma nova evidência.</p>
        </div>
      `;
      return container;
    }

    let rowsHTML = '';
    evidences.forEach(evidence => {
      // Determine file icon and class based on type
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

      rowsHTML += `
        <tr data-id="${evidence.id}">
          <td>
            <div class="file-name-cell">
              <i data-lucide="${iconName}" class="file-icon ${iconClass}"></i>
              <span>${evidence.nome}</span>
            </div>
          </td>
          <td>
            <span class="file-type-badge">
              ${evidence.tipo}
            </span>
          </td>
          <td>${evidence.data}</td>
          <td>${evidence.evento}</td>
          <td>
            <span class="badge ${categoryClass}">
              ${evidence.categoria}
            </span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="avatar-initial">${evidence.responsavel.charAt(0)}</div>
              <span>${evidence.responsavel}</span>
            </div>
          </td>
          <td>
            <div class="tags-list">
              ${tagsHTML}
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-view-details" data-id="${evidence.id}">
              <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
              Visualizar
            </button>
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <table class="evidence-table">
        <thead>
          <tr>
            <th>Nome do Arquivo</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Evento</th>
            <th>Categoria CERNE</th>
            <th>Responsável</th>
            <th>Tags</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    `;

    // Attach click listeners to the "Visualizar" buttons
    container.querySelectorAll('.btn-view-details').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = button.getAttribute('data-id');
        onViewDetailsClick(id);
      });
    });

    // Also make rows clickable for convenience
    container.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        onViewDetailsClick(id);
      });
      row.style.cursor = 'pointer';
    });

    return container;
  }
};
