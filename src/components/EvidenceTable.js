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
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Helper para gerar/obter uma cor consistente baseada no nome ou propriedade do usuário
function getAvatarStyle(responsavelName, customColor) {
  // Se o objeto já trouxer uma cor definida nas configurações
  if (customColor) {
    return `background-color: ${customColor}; color: #ffffff; font-weight: 600;`;
  }

  // Paleta executiva do CEI
  const palette = ['#0066cc', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0284c7'];
  
  if (!responsavelName) {
    return `background-color: var(--primary); color: #ffffff; font-weight: 600;`;
  }

  // Gera um índice numérico simples a partir da soma dos caracteres do nome
  let hash = 0;
  for (let i = 0; i < responsavelName.length; i++) {
    hash = responsavelName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % palette.length;
  return `background-color: ${palette[index]}; color: #ffffff; font-weight: 600;`;
}

    function formatResponsavelName(nomeCompleto, lista = []) {
      if (!nomeCompleto) return 'Equipe CEI';

      const partes = nomeCompleto.trim().split(/\s+/);
      const primeiroNome = partes[0];

      if (partes.length === 1) return primeiroNome;

      const nomeLower = nomeCompleto.trim().toLowerCase();

      const temDuplicado = lista.some(outroNome => {
        if (!outroNome) return false;
        const outroTrim = outroNome.trim();
        const outroLower = outroTrim.toLowerCase();

        if (
          outroLower === nomeLower ||
          outroLower.startsWith(nomeLower) ||
          nomeLower.startsWith(outroLower)
        ) {
          return false;
        }

        const outroPrimeiro = outroTrim.split(/\s+/)[0];
        return outroPrimeiro.toLowerCase() === primeiroNome.toLowerCase();
      });

      if (temDuplicado) {
        const ultimoSobrenome = partes[partes.length - 1];
        return `${primeiroNome} ${ultimoSobrenome}`;
      }

      return primeiroNome;
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

    // 1. Aplica a ordenação na lista inteira recebida
    const sortedEvidences = this.sortEvidences(evidences);

    // 2. Lógica de Paginação na lista ordenada
    const totalItems = sortedEvidences.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const paginatedEvidences = sortedEvidences.slice(startIndex, startIndex + this.itemsPerPage);

    // --- MONTAGEM DAS LINHAS DA TABELA ---
    let rowsHTML = '';
    paginatedEvidences.forEach(evidence => {
      const hasLink = !!evidence.link;
      const hasFile = evidence.tipo !== 'link' && evidence.nome;
      let displayType = evidence.tipo || 'Desconhecido';

      const getTypeConfig = (tipo) => {
        switch (tipo) {
          case 'pdf':
            return { icon: 'file-text', klass: 'file-icon-pdf', label: 'PDF' };
          case 'imagem':
            return { icon: 'image', klass: 'file-icon-imagem', label: 'Imagem' };
          case 'planilha':
            return { icon: 'file-spreadsheet', klass: 'file-icon-planilha', label: 'Planilha' };
          case 'video':
            return { icon: 'video', klass: 'file-icon-video', label: 'Vídeo' };
          case 'link':
            return { icon: 'link', klass: 'file-icon-link', label: 'Link' };
          default:
            return { icon: 'file', klass: 'file-icon-documento', label: 'Documento' };
        }
      };

      let iconHtml = '';

      if (hasFile && hasLink) {
        const config = getTypeConfig(evidence.tipo);
        displayType = `${config.label} + Link`;
        iconHtml = `
          <div style="display: flex; align-items: center; gap: 4px;">
            <i data-lucide="${config.icon}" class="file-icon ${config.klass}"></i>
            <i data-lucide="link" class="file-icon file-icon-link" style="width: 14px; height: 14px;" title="Contém link vinculado"></i>
          </div>
        `;
      } else if (hasFile) {
        const config = getTypeConfig(evidence.tipo);
        displayType = config.label;
        iconHtml = `<i data-lucide="${config.icon}" class="file-icon ${config.klass}"></i>`;
      } else if (hasLink) {
        displayType = 'Link';
        iconHtml = `<i data-lucide="link" class="file-icon file-icon-link"></i>`;
      }

      const truncateWords = (str, max) => {
        if (!str || str.trim() === '' || str.trim().toLowerCase() === 'sem evento') return '';
        const words = str.trim().split(/\s+/);
        return words.length > max ? words.slice(0, max).join(' ') + '...' : str;
      };

      const eventoFormatado = truncateWords(evidence.evento, 5);
      const eventoHTML = eventoFormatado 
        ? escapeHtml(eventoFormatado) 
        : '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.8rem;">—</span>';

      const tagsHTML = (evidence.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
      const nomeFormatado = formatResponsavelName(evidence.responsavel, listaFinalResponsaveis);

      const categoriesList = Array.isArray(evidence.categorias) && evidence.categorias.length > 0 
        ? evidence.categorias 
        : (evidence.categoria ? [evidence.categoria] : []);

      const categoriesHTML = categoriesList.length > 0 
        ? categoriesList.map(cat => {
            const customStyle = window.getCategoryStyle ? window.getCategoryStyle(cat) : '';
            return `<span class="badge" style="${customStyle}">${escapeHtml(cat)}</span>`;
          }).join(' ')
        : '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.8rem;">—</span>';

        const avatarStyle = getAvatarStyle(evidence.responsavel, evidence.responsavelColor);
        
      rowsHTML += `
        <tr data-id="${evidence.id}">
          <td>
            <div class="file-name-cell">
              ${iconHtml}
              <span>${escapeHtml(evidence.titulo || evidence.nome)}</span>
            </div>
          </td>
          <td><span class="file-type-badge">${escapeHtml(displayType)}</span></td>
          <td>${escapeHtml(evidence.data)}</td>
          <td title="${escapeHtml(evidence.evento || '')}">${eventoHTML}</td>
          <td><div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">${categoriesHTML}</div></td>
          <td>
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <div class="avatar-initial" style="${avatarStyle}">
        ${escapeHtml(evidence.responsavel ? evidence.responsavel.charAt(0) : 'U')}
      </div>
      <span>${escapeHtml(nomeFormatado)}</span>
    </div>
  </td>
          <td><div class="tags-list">${tagsHTML}</div></td>
        </tr>
      `;
    });

    // Helper para gerar o cabeçalho com seta interativa
    const renderSortableHeader = (label, fieldKey) => {
      const isActive = this.sortField === fieldKey;
      let iconName = 'arrow-up-down';

      if (isActive) {
        iconName = this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
      }

      return `
        <th class="sortable ${isActive ? 'active' : ''}" data-sort="${fieldKey}">
          <div class="th-sort-wrapper">
            <span>${label}</span>
            <i data-lucide="${iconName}" class="sort-icon"></i>
          </div>
        </th>
      `;
    };

    // Estrutura Base da Tabela
    container.innerHTML = `
      <table class="evidence-table">
        <thead>
          <tr>
            ${renderSortableHeader('Título', 'titulo')}
            ${renderSortableHeader('Tipo', 'tipo')}
            ${renderSortableHeader('Data', 'data')}
            ${renderSortableHeader('Evento', 'evento')}
            <th>Categoria CERNE</th>
            ${renderSortableHeader('Responsável', 'responsavel')}
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    `;

    // Handler de clique nos cabeçalhos ordenáveis
    const self = this;
    container.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');

        if (self.sortField === field) {
          // Inverte a direção se já for o campo ativo
          self.sortDirection = self.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          // Troca o campo e define ordem padrão
          self.sortField = field;
          self.sortDirection = field === 'data' ? 'desc' : 'asc'; // Data padrão recente; texto padrão A-Z
        }

        // Reseta para primeira página para mostrar os resultados ordenados do topo
        self.currentPage = 1;

        // Re-renderiza a tabela
        const parent = container.parentElement;
        if (parent) {
          const newTable = self.render(evidences, onViewDetailsClick, self.itemsPerPage, listaFinalResponsaveis);
          parent.replaceChild(newTable, container);
          if (window.lucide) window.lucide.createIcons();
        }
      });
    });

    // Adiciona evento de clique nas linhas
    container.querySelectorAll('tbody tr').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        onViewDetailsClick(id);
      });
      row.style.cursor = 'pointer';
    });

    // --- INJEÇÃO DA PAGINAÇÃO ---
    if (window.CerneApp.Pagination) {
      const paginationElement = window.CerneApp.Pagination.render({
        currentPage: self.currentPage,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: self.itemsPerPage,
        onPageChange(newPage) {
          self.currentPage = newPage;
          const parent = container.parentElement;
          if (parent) {
            const newTable = self.render(evidences, onViewDetailsClick, self.itemsPerPage, listaFinalResponsaveis);
            parent.replaceChild(newTable, container);
            if (window.lucide) window.lucide.createIcons();
          }
        },
        onItemsPerPageChange(newItemsPerPage) {
          self.itemsPerPage = newItemsPerPage;
          self.currentPage = 1;
          const parent = container.parentElement;
          if (parent) {
            const newTable = self.render(evidences, onViewDetailsClick, self.itemsPerPage, listaFinalResponsaveis);
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