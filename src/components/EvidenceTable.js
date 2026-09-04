window.CerneApp = window.CerneApp || {};

window.CerneApp.EvidenceTable = {
  // Guardamos o estado da paginação e ordenação no módulo
  currentPage: 1,
  itemsPerPage: 8,

  // Estado Padrão: Data mais recente primeiro (desc)
  sortField: 'data',
  sortDirection: 'desc',

  resetPage() {
    this.currentPage = 1;
  },

  // Helper para converter string de data "DD/MM/YYYY" em Date objeto para ordenação real
  parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      // ano, mes (0-indexado), dia
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return new Date(dateStr);
  },

// Função interna para ordenar a lista de evidências
  sortEvidences(evidences) {
    const field = this.sortField;
    const isAsc = this.sortDirection === 'asc';

    return [...evidences].sort((a, b) => {
      let valA = '';
      let valB = '';

      // Ordenação especial para campo de Data
      if (field === 'data') {
        const dateA = this.parseDate(a.data);
        const dateB = this.parseDate(b.data);
        return isAsc ? dateA - dateB : dateB - dateA;
      }

      // Extração de valores conforme o campo
      if (field === 'titulo') {
        valA = a.titulo || a.nome || '';
        valB = b.titulo || b.nome || '';
      } else if (field === 'tipo') {
        valA = a.tipo || '';
        valB = b.tipo || '';
      } else if (field === 'evento') {
        valA = a.evento || '';
        valB = b.evento || '';
      } else if (field === 'responsavel') {
        valA = a.responsavel || '';
        valB = b.responsavel || '';
      } else {
        return 0;
      }

      // Identifica se os valores estão vazios ou contêm o traço de fallback
      const aIsEmpty = !valA || valA.trim() === '' || valA === '—' || valA.trim().toLowerCase() === 'sem evento';
      const bIsEmpty = !valB || valB.trim() === '' || valB === '—' || valB.trim().toLowerCase() === 'sem evento';

      // Trata a posição dos vazios dependendo da direção (Ascendente vs Decrescente)
      if (aIsEmpty && !bIsEmpty) return isAsc ? 1 : -1;
      if (!aIsEmpty && bIsEmpty) return isAsc ? -1 : 1;
      if (aIsEmpty && bIsEmpty) return 0;

      // Ordenação normal por texto para itens com conteúdo real
      const comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
      return isAsc ? comparison : -comparison;
    });
  },

  render(evidences, onViewDetailsClick, customItemsPerPage, listaResponsaveis = []) {
    if (customItemsPerPage && typeof customItemsPerPage === 'number') {
      this.itemsPerPage = customItemsPerPage;
    }

    const container = document.createElement('div');
    container.className = 'table-container';

    const listaFinalResponsaveis = Array.isArray(listaResponsaveis) && listaResponsaveis.length > 0
      ? listaResponsaveis
      : [...new Set((evidences || []).map(e => e.responsavel).filter(Boolean))];

    function escapeHtml(value) {
      return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function getAvatarStyle(responsavelName, customColor) {
      if (customColor) return `background-color: ${customColor} !important; color: #ffffff !important; font-weight: 600;`;
      const palette = ['#0066cc', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0284c7'];
      if (!responsavelName) return `background-color: var(--primary); color: #ffffff; font-weight: 600;`;
      let hash = 0;
      for (let i = 0; i < responsavelName.length; i++) hash = responsavelName.charCodeAt(i) + ((hash << 5) - hash);
      return `background-color: ${palette[Math.abs(hash) % palette.length]} !important; color: #ffffff !important; font-weight: 600;`;
    }

    function formatResponsavelName(nomeCompleto, lista = []) {
      if (!nomeCompleto) return 'Equipe CEI';
      const partes = nomeCompleto.trim().split(/\s+/);
      const primeiroNome = partes[0];
      if (partes.length === 1) return primeiroNome;
      const nomeLower = nomeCompleto.trim().toLowerCase();
      const temDuplicado = lista.some(outroNome => {
        if (!outroNome) return false;
        const outroLower = outroNome.trim().toLowerCase();
        if (outroLower === nomeLower || outroLower.startsWith(nomeLower) || nomeLower.startsWith(outroLower)) return false;
        return outroNome.trim().split(/\s+/)[0].toLowerCase() === primeiroNome.toLowerCase();
      });
      return temDuplicado ? `${primeiroNome} ${partes[partes.length - 1]}` : primeiroNome;
    }

    // Ordenação e Paginação (processa normalmente mesmo se a lista for vazia)
    const sortedEvidences = this.sortEvidences(evidences || []);
    const totalItems = sortedEvidences.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedEvidences = sortedEvidences.slice(startIndex, startIndex + this.itemsPerPage);

    let rowsHTML = '';
    let emptyStateHTML = '';

    if (paginatedEvidences.length === 0) {
      // Renderiza o estado vazio DENTRO do corpo da tabela
      emptyStateHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state" style="box-shadow: none; border: none; background: transparent; margin: 2rem 0;">
              <div class="empty-state-illustration">
                <div class="empty-state-illustration-glow"></div>
                <div class="empty-state-illustration-frame">
                  <i data-lucide="file-text" class="empty-state-illustration-icon doc-icon"></i>
                  <i data-lucide="search" class="empty-state-illustration-icon search-icon"></i>
                </div>
              </div>
              <h3>Nenhuma evidência encontrada</h3>
              <p>Tente ajustar os termos de pesquisa ou limpar os filtros.</p>
            </div>
          </td>
        </tr>
      `;
    } else {
      paginatedEvidences.forEach(evidence => {
        const hasLink = !!evidence.link;
        const hasFile = evidence.tipo !== 'link' && evidence.nome;
        let displayType = evidence.tipo || 'Desconhecido';
        let iconHtml = '';

        const getTypeConfig = (tipo) => {
          switch (tipo) {
            case 'pdf': return { icon: 'file-text', klass: 'file-icon-pdf', label: 'PDF' };
            case 'imagem': return { icon: 'image', klass: 'file-icon-imagem', label: 'Imagem' };
            case 'planilha': return { icon: 'file-spreadsheet', klass: 'file-icon-planilha', label: 'Planilha' };
            case 'video': return { icon: 'video', klass: 'file-icon-video', label: 'Vídeo' };
            case 'link': return { icon: 'link', klass: 'file-icon-link', label: 'Link' };
            default: return { icon: 'file', klass: 'file-icon-documento', label: 'Documento' };
          }
        };

        if (hasFile && hasLink) {
          const config = getTypeConfig(evidence.tipo);
          displayType = `${config.label} + Link`;
          iconHtml = `<div style="display: flex; align-items: center; gap: 4px;"><i data-lucide="${config.icon}" class="file-icon ${config.klass}"></i><i data-lucide="link" class="file-icon file-icon-link" style="width: 14px; height: 14px;" title="Contém link vinculado"></i></div>`;
        } else if (hasFile) {
          const config = getTypeConfig(evidence.tipo);
          displayType = config.label;
          iconHtml = `<i data-lucide="${config.icon}" class="file-icon ${config.klass}"></i>`;
        } else if (hasLink) {
          displayType = 'Link';
          iconHtml = `<i data-lucide="link" class="file-icon file-icon-link"></i>`;
        }

        const eventoHTML = evidence.evento && evidence.evento.trim() !== 'Sem Evento'
          ? escapeHtml(evidence.evento.split(/\s+/).length > 5 ? evidence.evento.split(/\s+/).slice(0, 5).join(' ') + '...' : evidence.evento) 
          : '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.8rem;">—</span>';

        const tagsHTML = (evidence.tags || []).map(tag => `<span class="tag" style="${window.CerneConfig.tagsStyle}">${escapeHtml(tag)}</span>`).join('');
        const nomeFormatado = formatResponsavelName(evidence.responsavel, listaFinalResponsaveis);
        
        const categoriesList = Array.isArray(evidence.categorias) && evidence.categorias.length > 0 ? evidence.categorias : (evidence.categoria ? [evidence.categoria] : []);
        const categoriesHTML = categoriesList.length > 0 
          ? categoriesList.map(cat => `<span class="badge" style="${window.getCategoryStyle ? window.getCategoryStyle(cat) : ''}">${escapeHtml(cat)}</span>`).join(' ')
          : '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.8rem;">—</span>';

        rowsHTML += `
          <tr data-id="${evidence.id}">
            <td><div class="file-name-cell">${iconHtml}<span>${escapeHtml(evidence.titulo || evidence.nome)}</span></div></td>
            <td><span class="file-type-badge">${escapeHtml(displayType)}</span></td>
            <td>${escapeHtml(evidence.data)}</td>
            <td title="${escapeHtml(evidence.evento || '')}">${eventoHTML}</td>
            <td><div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">${categoriesHTML}</div></td>
            <td><div style="display: flex; align-items: center; gap: 0.5rem;"><div class="avatar-initial" style="${getAvatarStyle(evidence.responsavel, evidence.responsavelColor)}">${escapeHtml(evidence.responsavel ? evidence.responsavel.charAt(0) : 'U')}</div><span>${escapeHtml(nomeFormatado)}</span></div></td>
            <td><div class="tags-list">${tagsHTML}</div></td>
          </tr>
        `;
      });
    }

    const renderSortableHeader = (label, fieldKey) => {
      const isActive = this.sortField === fieldKey;
      return `<th class="sortable ${isActive ? 'active' : ''}" data-sort="${fieldKey}"><div class="th-sort-wrapper"><span>${label}</span><i data-lucide="${isActive ? (this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down') : 'arrow-up-down'}" class="sort-icon"></i></div></th>`;
    };

    container.innerHTML = `
      <table class="evidence-table">
        <thead>
          <tr>
            ${renderSortableHeader('Título', 'titulo')}
            ${renderSortableHeader('Tipo', 'tipo')}
            ${renderSortableHeader('Data', 'data')}
            ${renderSortableHeader('Evento', 'evento')}
            <th>
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <span>Categoria</span>
                <div style="position: relative; display: inline-flex; align-items: center;">
                  <select id="table-cerne-filter" style="appearance: none; background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 0.15rem 1.4rem 0.15rem 0.5rem; font-weight: 600; color: var(--text-primary); cursor: pointer; outline: none; font-size: inherit; font-family: inherit;">
                    <option value="todos">Cerne</option>
                    <option value="Cerne 1">Cerne 1</option>
                    <option value="Cerne 2">Cerne 2</option>
                    <option value="Cerne 3">Cerne 3</option>
                    <option value="Cerne 4">Cerne 4</option>
                  </select>
                  <i data-lucide="chevron-down" style="position: absolute; right: 4px; width: 14px; height: 14px; pointer-events: none; color: var(--text-secondary);"></i>
                </div>
              </div>
            </th>
            ${renderSortableHeader('Responsável', 'responsavel')}
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML || emptyStateHTML}
        </tbody>
      </table>
    `;

    const cerneFilter = container.querySelector('#table-cerne-filter');
    if (cerneFilter) {
      cerneFilter.value = window.CerneApp.currentTableCerneFilter || 'todos';
      cerneFilter.addEventListener('change', (e) => {
        window.CerneApp.currentTableCerneFilter = e.target.value;
        if (typeof window.CerneApp.triggerFilterRefresh === 'function') window.CerneApp.triggerFilterRefresh();
      });
    }

    const self = this;
    container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (self.sortField === field) self.sortDirection = self.sortDirection === 'asc' ? 'desc' : 'asc';
        else { self.sortField = field; self.sortDirection = field === 'data' ? 'desc' : 'asc'; }
        self.currentPage = 1;
        const parent = container.parentElement;
        if (parent) {
          parent.replaceChild(self.render(evidences, onViewDetailsClick, self.itemsPerPage, listaFinalResponsaveis), container);
          if (window.lucide) window.lucide.createIcons();
        }
      });
    });

    container.querySelectorAll('tbody tr[data-id]').forEach(row => {
      row.addEventListener('click', () => onViewDetailsClick(row.getAttribute('data-id')));
      row.style.cursor = 'pointer';
    });

    if (window.CerneApp.Pagination && totalItems > 0) {
      container.appendChild(window.CerneApp.Pagination.render({
        currentPage: self.currentPage, totalPages, totalItems, itemsPerPage: self.itemsPerPage,
        onPageChange(newPage) {
          self.currentPage = newPage;
          container.parentElement?.replaceChild(self.render(evidences, onViewDetailsClick, self.itemsPerPage, listaFinalResponsaveis), container);
          if (window.lucide) window.lucide.createIcons();
        },
        onItemsPerPageChange(newItemsPerPage) {
          self.itemsPerPage = newItemsPerPage; self.currentPage = 1;
          container.parentElement?.replaceChild(self.render(evidences, onViewDetailsClick, self.itemsPerPage, listaFinalResponsaveis), container);
          if (window.lucide) window.lucide.createIcons();
        }
      }));
    }

    return container;
  }
};