window.CerneApp = window.CerneApp || {};

window.CerneApp.EvidenceTable = {
  // Guardamos o estado da paginação no próprio módulo para re-renderização fluida
  currentPage: 1,
  itemsPerPage: 8,

  // Método auxiliar para resetar para a página 1 (pode ser chamado externamente ao aplicar filtros)
  resetPage() {
    this.currentPage = 1;
  },

  render(evidences, onViewDetailsClick) {
    const container = document.createElement('div');
    container.className = 'table-container';

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Tratamento de Estado Vazio
    if (!evidences || evidences.length === 0) {
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

    // --- LÓGICA DE PAGINAÇÃO ---
    const totalItems = evidences.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

    // Garante que a página atual não fique maior que o total caso a lista diminua
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    // Corta a lista para exibir apenas a fatia da página atual
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedEvidences = evidences.slice(startIndex, startIndex + this.itemsPerPage);

    // --- MONTAGEM DAS LINHAS DA TABELA (Usando a lista paginada) ---
    let rowsHTML = '';
    paginatedEvidences.forEach(evidence => {
      // Determina ícone e classe baseados no tipo
      let iconName = 'file';
      let iconClass = 'file-icon-documento';
      if (evidence.tipo === 'pdf') {
        iconName = 'file-text';
        iconClass = 'file-icon-pdf';
      } else if (evidence.tipo === 'imagem') {
        iconName = 'image';
        iconClass = 'file-icon-imagem';
      }

      // Gera HTML das tags
      const tagsHTML = (evidence.tags || [])
        .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join('');

      // Trata array de categorias ou string única
      const categoriesList = Array.isArray(evidence.categorias) && evidence.categorias.length > 0
        ? evidence.categorias
        : (evidence.categoria ? [evidence.categoria] : []);

      const categoriesHTML = categoriesList.map(cat => {
        const customStyle = window.getCategoryStyle ? window.getCategoryStyle(cat) : '';
        return `<span class="badge" style="${customStyle}">${escapeHtml(cat)}</span>`;
      }).join(' ');

      rowsHTML += `
        <tr data-id="${evidence.id}">
          <td>
            <div class="file-name-cell">
              <i data-lucide="${iconName}" class="file-icon ${iconClass}"></i>
              <span>${escapeHtml(evidence.titulo || evidence.nome)}</span>
            </div>
          </td>
          <td>
            <span class="file-type-badge">
              ${escapeHtml(evidence.tipo)}
            </span>
          </td>
          <td>${escapeHtml(evidence.data)}</td>
          <td>${escapeHtml(evidence.evento)}</td>
          <td>
            <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
              ${categoriesHTML}
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="avatar-initial">${escapeHtml(evidence.responsavel ? evidence.responsavel.charAt(0) : 'U')}</div>
              <span>${escapeHtml(evidence.responsavel)}</span>
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

    // Estrutura Base da Tabela
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

    // Adiciona evento de clique nas linhas
    container.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        onViewDetailsClick(id);
      });
      row.style.cursor = 'pointer';
    });

    // --- INJEÇÃO DO COMPONENTE DE PAGINAÇÃO ---
    if (window.CerneApp.Pagination) {
      const self = this;
      const paginationElement = window.CerneApp.Pagination.render({
        currentPage: self.currentPage,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: self.itemsPerPage,
        onPageChange(newPage) {
          self.currentPage = newPage;
          // Re-renderiza a tabela no container pai
          const parent = container.parentElement;
          if (parent) {
            const newTable = self.render(evidences, onViewDetailsClick);
            parent.replaceChild(newTable, container);
            if (window.lucide) window.lucide.createIcons();
          }
        },
        onItemsPerPageChange(newItemsPerPage) {
          self.itemsPerPage = newItemsPerPage;
          self.currentPage = 1; // Reseta para a página 1 ao mudar a quantidade
          const parent = container.parentElement;
          if (parent) {
            const newTable = self.render(evidences, onViewDetailsClick);
            parent.replaceChild(newTable, container);
            if (window.lucide) window.lucide.createIcons();
          }
        }
      });

      container.appendChild(paginationElement);
    }

    return container;
  }
};