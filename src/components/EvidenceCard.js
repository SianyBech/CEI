window.CerneApp = window.CerneApp || {};

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

    // Helper para mapear tipo -> ícone do Lucide, classe CSS e label
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

    // Helper para truncar evento (max 5 palavras), com fallback de traço se vazio
    const truncateWords = (str, max) => {
      if (!str || str.trim() === '' || str.trim().toLowerCase() === 'sem evento') return '';
      const words = str.trim().split(/\s+/);
      return words.length > max ? words.slice(0, max).join(' ') + '...' : str;
    };

    // Empty State (nenhuma evidência encontrada)
    if (!Array.isArray(evidences) || evidences.length === 0) {
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
      const hasLink = !!evidence.link;
      const hasFile = evidence.tipo !== 'link' && evidence.nome;

      let iconHtml = '';
      let displayType = evidence.tipo || 'Documento';

      // Tratamento para exibição híbrida (Arquivo + Link) e ícone correto
      if (hasFile && hasLink) {
        const config = getTypeConfig(evidence.tipo);
        displayType = `${config.label} + Link`;
        iconHtml = `
          <div style="display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;">
            <i data-lucide="${config.icon}" class="file-icon ${config.klass}"></i>
            <i data-lucide="link" class="file-icon file-icon-link" style="width: 14px; height: 14px;" title="Contém link vinculado"></i>
          </div>
        `;
      } else if (hasFile) {
        const config = getTypeConfig(evidence.tipo);
        displayType = config.label;
        iconHtml = `<i data-lucide="${config.icon}" class="file-icon ${config.klass}" style="margin-top: 2px;"></i>`;
      } else if (hasLink) {
        displayType = 'Link';
        iconHtml = `<i data-lucide="link" class="file-icon file-icon-link" style="margin-top: 2px;"></i>`;
      } else {
        const config = getTypeConfig(evidence.tipo);
        displayType = config.label;
        iconHtml = `<i data-lucide="${config.icon}" class="file-icon ${config.klass}" style="margin-top: 2px;"></i>`;
      }

      // Trata lista de categorias (sem "Geral" automático)
      const categoriesList = Array.isArray(evidence.categorias) && evidence.categorias.length > 0
        ? evidence.categorias
        : (evidence.categoria ? [evidence.categoria] : []);

      const categoriesHTML = categoriesList.length > 0
        ? categoriesList.map(cat => {
            const dynamicStyle = window.getCategoryStyle ? window.getCategoryStyle(cat) : '';
            return `<span class="badge badge-dynamic" style="${dynamicStyle}">${escapeHtml(cat)}</span>`;
          }).join(' ')
        : '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.8rem;">—</span>';

      // Trata lista de tags
      const tagsHTML = (evidence.tags || [])
        .map(tag => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join('');

      // Formatação do Evento (se não tiver, mostra traço)
      const eventoFormatted = truncateWords(evidence.evento, 5);
      const eventoHTML = eventoFormatted 
        ? escapeHtml(eventoFormatted)
        : '<span style="color: var(--text-tertiary); font-style: italic;">—</span>';

      const tituloText = evidence.titulo || evidence.nome || 'Sem título';
      const responsavelText = evidence.responsavel || 'Não especificado';
      const initialLetter = responsavelText.charAt(0).toUpperCase();

      cardsHTML += `
        <div class="evidence-card" data-id="${escapeHtml(evidence.id)}">
          <div class="card-header">
            <div style="display: flex; align-items: flex-start; gap: 0.65rem; min-width: 0;">
              ${iconHtml}
              <span class="card-title" title="${escapeHtml(tituloText)}">${escapeHtml(tituloText)}</span>
            </div>
            <span class="file-type-badge">${escapeHtml(displayType)}</span>
          </div>

          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.2rem;">
            ${categoriesHTML}
          </div>

          <div class="card-body">
            <strong style="display:block; margin-bottom: 4px; color: var(--text-primary); font-size: 0.8rem;">
              Evento: ${eventoHTML}
            </strong>
            <div style="color: var(--text-secondary); font-size: 0.85rem;">
              ${escapeHtml(evidence.resumo || 'Sem resumo disponível.')}
            </div>
          </div>

          ${tagsHTML ? `<div class="tags-list" style="margin-top: 0.25rem;">${tagsHTML}</div>` : ''}

          <div class="card-footer">
            <div class="card-author">
              <div class="avatar-initial">${escapeHtml(initialLetter)}</div>
              <span>${escapeHtml(responsavelText)}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">${escapeHtml(evidence.data || '')}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = cardsHTML;

    // Attach click listeners
    container.querySelectorAll('.evidence-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (typeof onViewDetailsClick === 'function') {
          onViewDetailsClick(id);
        }
      });
    });

    return container;
  }
};