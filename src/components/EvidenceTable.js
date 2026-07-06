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
              <span>${evidence.titulo || evidence.nome}</span>
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
        </tr>
      `;
    });

    container.innerHTML = `
      <table class="evidence-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Evento</th>
            <th>Categoria CERNE</th>
            <th>Responsável</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    `;

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
